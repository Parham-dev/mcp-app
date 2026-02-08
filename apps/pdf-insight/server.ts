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

export const appId = "pdf-insight";
export const appName = "PDF Viewer";
export const appDescription = "Interactive PDF viewer with remote URL support.";

// =============================================================================
// Configuration
// =============================================================================

export const DEFAULT_PDF = "https://arxiv.org/pdf/1706.03762"; // Attention Is All You Need
export const MAX_CHUNK_BYTES = 512 * 1024; // 512KB max per request
export const RESOURCE_URI = "ui://pdf-insight/mcp-app.html";

/** Allowed remote origins (security allowlist) */
export const allowedRemoteOrigins = new Set([
  "https://agrirxiv.org",
  "https://arxiv.org",
  "https://chemrxiv.org",
  "https://edarxiv.org",
  "https://engrxiv.org",
  "https://hal.science",
  "https://osf.io",
  "https://psyarxiv.com",
  "https://ssrn.com",
  "https://www.biorxiv.org",
  "https://www.eartharxiv.org",
  "https://www.medrxiv.org",
  "https://www.preprints.org",
  "https://www.researchsquare.com",
  "https://www.sportarxiv.org",
  "https://zenodo.org",
]);

/** Allowed local file paths (populated from env) */
export const allowedLocalFiles = new Set<string>();

function addLocalFile(filePath: string) {
  const absolutePath = path.resolve(filePath.trim());
  if (!absolutePath) return;
  if (fs.existsSync(absolutePath)) {
    allowedLocalFiles.add(absolutePath);
  }
}

function addLocalDirectory(dirPath: string) {
  const absoluteDir = path.resolve(dirPath.trim());
  if (!absoluteDir || !fs.existsSync(absoluteDir)) return;
  const entries = fs.readdirSync(absoluteDir, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (!entry.name.toLowerCase().endsWith(".pdf")) continue;
    addLocalFile(path.join(absoluteDir, entry.name));
  }
}

function loadLocalPathsFromEnv() {
  const files = process.env.PDF_LOCAL_FILES;
  if (files) {
    for (const filePath of files.split(",")) {
      addLocalFile(filePath);
    }
  }

  const dirs = process.env.PDF_LOCAL_DIRS;
  if (dirs) {
    for (const dirPath of dirs.split(",")) {
      addLocalDirectory(dirPath);
    }
  }
}

loadLocalPathsFromEnv();

const HTML_PATH = path.join(
  import.meta.dirname,
  "../../dist/apps/pdf-insight/mcp-app.html",
);

// =============================================================================
// URL Validation & Normalization
// =============================================================================

export function isFileUrl(url: string): boolean {
  return url.startsWith("file://");
}

export function isArxivUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (
      parsed.hostname === "arxiv.org" || parsed.hostname === "www.arxiv.org"
    );
  } catch {
    return false;
  }
}

export function normalizeArxivUrl(url: string): string {
  // Convert arxiv abstract URLs to PDF URLs
  // https://arxiv.org/abs/1706.03762 -> https://arxiv.org/pdf/1706.03762
  return url.replace("/abs/", "/pdf/").replace(/\.pdf$/, "");
}

export function fileUrlToPath(fileUrl: string): string {
  return decodeURIComponent(fileUrl.replace("file://", ""));
}

export function pathToFileUrl(filePath: string): string {
  const absolutePath = path.resolve(filePath);
  return `file://${encodeURIComponent(absolutePath).replace(/%2F/g, "/")}`;
}

export function validateUrl(url: string): { valid: boolean; error?: string } {
  if (isFileUrl(url)) {
    const filePath = fileUrlToPath(url);
    if (!allowedLocalFiles.has(filePath)) {
      return {
        valid: false,
        error: `Local file not in allowed list: ${filePath}`,
      };
    }
    if (!fs.existsSync(filePath)) {
      return { valid: false, error: `File not found: ${filePath}` };
    }
    return { valid: true };
  }

  // Remote URL - check against allowed origins
  try {
    const parsed = new URL(url);
    const origin = `${parsed.protocol}//${parsed.hostname}`;
    if (
      ![...allowedRemoteOrigins].some((allowed) => origin.startsWith(allowed))
    ) {
      return { valid: false, error: `Origin not allowed: ${origin}` };
    }
    return { valid: true };
  } catch {
    return { valid: false, error: `Invalid URL: ${url}` };
  }
}

// =============================================================================
// Range Request Helpers
// =============================================================================

export async function readPdfRange(
  url: string,
  offset: number,
  byteCount: number,
): Promise<{ data: Uint8Array; totalBytes: number }> {
  const normalized = isArxivUrl(url) ? normalizeArxivUrl(url) : url;
  const clampedByteCount = Math.min(byteCount, MAX_CHUNK_BYTES);

  if (isFileUrl(normalized)) {
    const filePath = fileUrlToPath(normalized);
    const stats = await fs.promises.stat(filePath);
    const totalBytes = stats.size;

    // Clamp to file bounds
    const start = Math.min(offset, totalBytes);
    const end = Math.min(start + clampedByteCount, totalBytes);

    if (start >= totalBytes) {
      return { data: new Uint8Array(0), totalBytes };
    }

    // Read range from local file
    const buffer = Buffer.alloc(end - start);
    const fd = await fs.promises.open(filePath, "r");
    try {
      await fd.read(buffer, 0, end - start, start);
    } finally {
      await fd.close();
    }

    return { data: new Uint8Array(buffer), totalBytes };
  }

  // Remote URL - Range request
  const response = await fetch(normalized, {
    headers: {
      Range: `bytes=${offset}-${offset + clampedByteCount - 1}`,
    },
  });

  if (!response.ok && response.status !== 206) {
    throw new Error(
      `Range request failed: ${response.status} ${response.statusText}`,
    );
  }

  // Parse total size from Content-Range header
  const contentRange = response.headers.get("content-range");
  let totalBytes = 0;
  if (contentRange) {
    const match = contentRange.match(/bytes \d+-\d+\/(\d+)/);
    if (match) {
      totalBytes = parseInt(match[1], 10);
    }
  }

  const data = new Uint8Array(await response.arrayBuffer());
  return { data, totalBytes };
}

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
