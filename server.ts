import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult, ReadResourceResult } from "@modelcontextprotocol/sdk/types.js";
import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

// Works both from source (server.ts) and compiled (dist/server.js)
const DIST_DIR = import.meta.filename.endsWith(".ts")
  ? path.join(import.meta.dirname, "dist")
  : import.meta.dirname;

// Input schema for the hello-world tool
const HelloWorldInput = z.object({
  name: z.string().optional().describe("Name to greet"),
});

/**
 * Creates a new MCP server instance with tools and resources registered.
 */
export function createServer(): McpServer {
  const server = new McpServer({
    name: "MCP App Template",
    version: "1.0.0",
  });

  // Two-part registration: tool + resource, tied together by the resource URI.
  const resourceUri = "ui://hello-world/mcp-app.html";

  // Register a tool with UI metadata. When the host calls this tool, it reads
  // `_meta.ui.resourceUri` to know which resource to fetch and render as an
  // interactive UI.
  registerAppTool(server,
    "hello-world",
    {
      title: "Hello World",
      description: "A simple hello world MCP App that demonstrates the basics.",
      inputSchema: HelloWorldInput,
      _meta: { ui: { resourceUri } }, // Links this tool to its UI resource
    },
    async (args): Promise<CallToolResult> => {
      const { name = "World" } = HelloWorldInput.parse(args);
      const greeting = `Hello, ${name}!`;
      const timestamp = new Date().toISOString();
      
      return {
        content: [{ type: "text", text: `${greeting} (at ${timestamp})` }],
        // structuredContent is available to the UI but not sent to the model
        structuredContent: {
          greeting,
          name,
          timestamp,
        },
      };
    },
  );

  // Register the resource, which returns the bundled HTML/JavaScript for the UI.
  registerAppResource(server,
    resourceUri,
    resourceUri,
    { mimeType: RESOURCE_MIME_TYPE },
    async (): Promise<ReadResourceResult> => {
      const html = await fs.readFile(path.join(DIST_DIR, "mcp-app.html"), "utf-8");
      return {
        contents: [{ uri: resourceUri, mimeType: RESOURCE_MIME_TYPE, text: html }],
      };
    },
  );

  return server;
}
