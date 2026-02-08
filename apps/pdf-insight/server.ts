/**
 * PDF Insight (PDF Viewer)
 *
 * An MCP server that displays PDFs in an interactive viewer.
 * Supports local files and remote URLs from academic sources.
 *
 * Tools:
 * - list_pdfs: List available PDFs
 * - display_pdf: Show interactive PDF viewer
 * - read_pdf_bytes: Stream PDF data in chunks (used by viewer)
 */

import { randomUUID } from "crypto";
import fs from "node:fs";
import path from "node:path";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  registerAppResource,
  registerAppTool,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import type {
  CallToolResult,
  ReadResourceResult,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { createDb } from "./db/client.js";
import { createRepository } from "./db/repository.js";

// --- Extracted modules ---
import {
  DEFAULT_PDF,
  RESOURCE_URI,
  allowedRemoteOrigins,
  allowedLocalFiles,
} from "./server/config.js";
import {
  isFileUrl,
  isArxivUrl,
  normalizeArxivUrl,
  fileUrlToPath,
  pathToFileUrl,
  validateUrl as _validateUrl,
} from "./server/url.js";
import { MAX_CHUNK_BYTES, readPdfRange } from "./server/pdf-reader.js";

// --- Re-exports for test compatibility ---
export { isFileUrl, isArxivUrl, normalizeArxivUrl, fileUrlToPath, pathToFileUrl };
export { allowedLocalFiles, allowedRemoteOrigins };
export { readPdfRange, MAX_CHUNK_BYTES };
export { DEFAULT_PDF, RESOURCE_URI };

/** Bound validateUrl that uses module-level config sets */
export function validateUrl(url: string): { valid: boolean; error?: string } {
  return _validateUrl(url, allowedRemoteOrigins, allowedLocalFiles);
}

export const appId = "pdf-insight";
export const appName = "PDF Viewer";
export const appDescription = "Interactive PDF viewer with remote URL support.";

const HTML_PATH = path.join(
  import.meta.dirname,
  "../../dist/apps/pdf-insight/mcp-app.html",
);

// =============================================================================
// MCP Server Factory
// =============================================================================

export function createServer(): McpServer {
  const server = new McpServer({ name: "PDF Server", version: "2.0.0" });
  const db = createDb();
  const repo = createRepository(db);

  // Tool: list_pdfs - List available PDFs (local files + allowed origins)
  server.tool(
    "list_pdfs",
    "List available PDFs that can be displayed",
    {},
    async (): Promise<CallToolResult> => {
      const pdfs: Array<{ url: string; type: "local" | "remote" }> = [];

      // Add local files
      for (const filePath of allowedLocalFiles) {
        pdfs.push({ url: pathToFileUrl(filePath), type: "local" });
      }

      // Note: Remote URLs from allowed origins can be loaded dynamically
      const text =
        pdfs.length > 0
          ? `Available PDFs:\n${pdfs.map((p) => `- ${p.url} (${p.type})`).join("\n")}\n\nRemote PDFs from ${[...allowedRemoteOrigins].join(", ")} can also be loaded dynamically.`
          : `No local PDFs configured. Remote PDFs from ${[...allowedRemoteOrigins].join(", ")} can be loaded dynamically.`;

      return {
        content: [{ type: "text", text }],
        structuredContent: {
          localFiles: pdfs.filter((p) => p.type === "local").map((p) => p.url),
          allowedOrigins: [...allowedRemoteOrigins],
        },
      };
    },
  );

  // Tool: read_pdf_bytes (app-only) - Range request for chunks
  registerAppTool(
    server,
    "read_pdf_bytes",
    {
      title: "Read PDF Bytes",
      description: "Read a range of bytes from a PDF (max 512KB per request)",
      inputSchema: {
        url: z.string().describe("PDF URL"),
        offset: z.number().min(0).default(0).describe("Byte offset"),
        byteCount: z
          .number()
          .min(1)
          .max(MAX_CHUNK_BYTES)
          .default(MAX_CHUNK_BYTES)
          .describe("Bytes to read"),
      },
      outputSchema: z.object({
        url: z.string(),
        bytes: z.string().describe("Base64 encoded bytes"),
        offset: z.number(),
        byteCount: z.number(),
        totalBytes: z.number(),
        hasMore: z.boolean(),
      }),
      _meta: { ui: { visibility: ["app"] } },
    },
    async ({ url, offset, byteCount }): Promise<CallToolResult> => {
      const validation = validateUrl(url);
      if (!validation.valid) {
        return {
          content: [{ type: "text", text: validation.error! }],
          isError: true,
        };
      }

      try {
        const normalized = isArxivUrl(url) ? normalizeArxivUrl(url) : url;
        const { data, totalBytes } = await readPdfRange(url, offset, byteCount);

        // Base64 encode for JSON transport
        const bytes = Buffer.from(data).toString("base64");
        const hasMore = offset + data.length < totalBytes;

        return {
          content: [
            {
              type: "text",
              text: `${data.length} bytes at ${offset}/${totalBytes}`,
            },
          ],
          structuredContent: {
            url: normalized,
            bytes,
            offset,
            byteCount: data.length,
            totalBytes,
            hasMore,
          },
        };
      } catch (err) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${err instanceof Error ? err.message : String(err)}`,
            },
          ],
          isError: true,
        };
      }
    },
  );

  // Build allowed domains list for tool description (strip https:// and www.)
  const allowedDomains = [...allowedRemoteOrigins]
    .map((origin) => origin.replace(/^https?:\/\/(www\.)?/, ""))
    .join(", ");

  // Tool: display_pdf - Show interactive viewer
  registerAppTool(
    server,
    "display_pdf",
    {
      title: "Display PDF",
      description: `Display an interactive PDF viewer.\n\nAccepts:\n- Local files explicitly added to the server (use list_pdfs to see available files)\n- Remote PDFs from: ${allowedDomains}`,
      inputSchema: {
        url: z.string().default(DEFAULT_PDF).describe("PDF URL"),
        page: z.number().min(1).default(1).describe("Initial page"),
      },
      outputSchema: z.object({
        url: z.string(),
        initialPage: z.number(),
        documentId: z.string(),
      }),
      _meta: { ui: { resourceUri: RESOURCE_URI } },
    },
    async ({ url, page }): Promise<CallToolResult> => {
      const normalized = isArxivUrl(url) ? normalizeArxivUrl(url) : url;
      const validation = validateUrl(normalized);

      if (!validation.valid) {
        return {
          content: [{ type: "text", text: validation.error! }],
          isError: true,
        };
      }

      const documentId = await repo.upsertDocument({
        title: undefined,
        sourceUrl: normalized,
      });

      return {
        content: [{ type: "text", text: `Displaying PDF: ${normalized}` }],
        structuredContent: {
          url: normalized,
          initialPage: page,
          documentId,
        },
        _meta: {
          viewUUID: randomUUID(),
        },
      };
    },
  );

  registerAppTool(
    server,
    "save_note",
    {
      title: "Save Note",
      description: "Save a note for a document selection",
      inputSchema: {
        documentId: z.string(),
        page: z.number().min(1),
        selectionText: z.string().optional(),
        noteText: z.string().min(1),
      },
      outputSchema: z.object({ id: z.string() }),
      _meta: { ui: { visibility: ["app"] } },
    },
    async ({ documentId, page, selectionText, noteText }): Promise<CallToolResult> => {
      const id = await repo.createNote({
        documentId,
        page,
        selectionText,
        noteText,
      });
      return {
        content: [{ type: "text", text: "Note saved." }],
        structuredContent: { id },
      };
    },
  );

  registerAppTool(
    server,
    "list_notes",
    {
      title: "List Notes",
      description: "List notes for a document",
      inputSchema: {
        documentId: z.string(),
      },
      outputSchema: z.object({
        notes: z.array(
          z.object({
            id: z.string(),
            page: z.number(),
            selectionText: z.string().nullable().optional(),
            noteText: z.string(),
          }),
        ),
      }),
      _meta: { ui: { visibility: ["app"] } },
    },
    async ({ documentId }): Promise<CallToolResult> => {
      const rows = await repo.listNotes(documentId);
      return {
        content: [{ type: "text", text: `Loaded ${rows.length} notes.` }],
        structuredContent: {
          notes: rows.map((row: { id: string; page: number; selectionText: string | null; noteText: string }) => ({
            id: row.id,
            page: row.page,
            selectionText: row.selectionText,
            noteText: row.noteText,
          })),
        },
      };
    },
  );

  registerAppTool(
    server,
    "save_highlight",
    {
      title: "Save Highlight",
      description: "Save a text highlight for a document",
      inputSchema: {
        documentId: z.string(),
        page: z.number().min(1),
        selectionText: z.string().min(1),
        color: z.string().optional(),
      },
      outputSchema: z.object({ id: z.string() }),
      _meta: { ui: { visibility: ["app"] } },
    },
    async ({ documentId, page, selectionText, color }): Promise<CallToolResult> => {
      const id = await repo.createHighlight({
        documentId,
        page,
        selectionText,
        color,
      });
      return {
        content: [{ type: "text", text: "Highlight saved." }],
        structuredContent: { id },
      };
    },
  );

  registerAppTool(
    server,
    "list_highlights",
    {
      title: "List Highlights",
      description: "List highlights for a document",
      inputSchema: {
        documentId: z.string(),
      },
      outputSchema: z.object({
        highlights: z.array(
          z.object({
            id: z.string(),
            page: z.number(),
            selectionText: z.string(),
            color: z.string().nullable().optional(),
          }),
        ),
      }),
      _meta: { ui: { visibility: ["app"] } },
    },
    async ({ documentId }): Promise<CallToolResult> => {
      const rows = await repo.listHighlights(documentId);
      return {
        content: [{ type: "text", text: `Loaded ${rows.length} highlights.` }],
        structuredContent: {
          highlights: rows.map((row: { id: string; page: number; selectionText: string; color: string | null }) => ({
            id: row.id,
            page: row.page,
            selectionText: row.selectionText,
            color: row.color,
          })),
        },
      };
    },
  );

  // Resource: UI HTML
  registerAppResource(
    server,
    RESOURCE_URI,
    RESOURCE_URI,
    { mimeType: RESOURCE_MIME_TYPE },
    async (): Promise<ReadResourceResult> => {
      const html = await fs.promises.readFile(HTML_PATH, "utf-8");
      const cspMeta = {
        ui: {
          csp: {
            "worker-src": ["blob:"],
            "script-src-elem": ["'unsafe-inline'", "data:", "blob:"],
            "script-src": ["'unsafe-inline'"],
            "style-src": ["'unsafe-inline'"],
            "img-src": ["data:"],
            "font-src": ["data:"],
            "media-src": ["data:"],
            "connect-src": ["'none'"],
            "frame-src": ["'none'"],
            "object-src": ["'none'"],
            "base-uri": ["'none'"],
            "default-src": ["'none'"],
          },
        },
      };
      return {
        contents: [
          {
            uri: RESOURCE_URI,
            mimeType: RESOURCE_MIME_TYPE,
            text: html,
            _meta: cspMeta,
          },
        ],
      };
    },
  );

  return server;
}
