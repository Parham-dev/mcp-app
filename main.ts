/**
 * Entry point for running the MCP server.
 * Run with: npx mcp-app-template
 * Or: node dist/index.js [--stdio]
 */

import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import cors from "cors";
import type { Request, Response } from "express";
import { createServer } from "./server.js";

/**
 * Starts an MCP server with Streamable HTTP transport in stateless mode.
 */
export async function startStreamableHTTPServer(
  createServer: () => McpServer,
): Promise<void> {
  const port = parseInt(process.env.PORT ?? "3001", 10);

  const app = createMcpExpressApp({ host: "0.0.0.0" });
  app.use(cors());

  app.all("/mcp", async (req: Request, res: Response) => {
    const server = createServer();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    res.on("close", () => {
      transport.close().catch(() => {});
      server.close().catch(() => {});
    });

    try {
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      console.error("MCP error:", error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: { code: -32603, message: "Internal server error" },
          id: null,
        });
      }
    }
  });

  app.listen(port, () => {
    console.log(`MCP App Template server running at http://localhost:${port}/mcp`);
  });
}

/**
 * Starts an MCP server with stdio transport.
 */
async function startStdioServer(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("MCP App Template server running on stdio");
}

// Main entry point
const args = process.argv.slice(2);
if (args.includes("--stdio")) {
  startStdioServer().catch(console.error);
} else {
  startStreamableHTTPServer(createServer).catch(console.error);
}
