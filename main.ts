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
 * Finds an available port, starting from the preferred port.
 */
async function findAvailablePort(preferredPort: number, maxAttempts = 10): Promise<number> {
  const net = await import("node:net");
  
  for (let i = 0; i < maxAttempts; i++) {
    const port = preferredPort + i;
    const isAvailable = await new Promise<boolean>((resolve) => {
      const server = net.createServer();
      server.once("error", () => resolve(false));
      server.once("listening", () => {
        server.close();
        resolve(true);
      });
      server.listen(port, "0.0.0.0");
    });
    
    if (isAvailable) return port;
  }
  
  throw new Error(`No available port found (tried ${preferredPort}-${preferredPort + maxAttempts - 1})`);
}

/**
 * Starts an MCP server with Streamable HTTP transport in stateless mode.
 */
export async function startStreamableHTTPServer(
  createServer: () => McpServer,
): Promise<void> {
  const preferredPort = parseInt(process.env.PORT ?? "3001", 10);
  
  let port: number;
  try {
    port = await findAvailablePort(preferredPort);
  } catch (error) {
    console.error("Failed to find available port:", error);
    process.exit(1);
  }
  
  if (port !== preferredPort) {
    console.log(`⚠️  Port ${preferredPort} is busy, using port ${port} instead`);
    console.log(`   Update your MCP config to: http://localhost:${port}/mcp`);
  }

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
