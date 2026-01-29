/**
 * Multi-App MCP Server Entry Point
 * Serves all registered MCP apps from a single deployment
 * 
 * Each app is available at: /{app-id}/mcp
 * Example: /recipe-remix/mcp, /weather/mcp, etc.
 */

import { createMcpExpressApp } from "@modelcontextprotocol/sdk/server/express.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import cors from "cors";
import type { Request, Response, NextFunction } from "express";
import { apps, getApp } from "./app-registry.js";

const port = parseInt(process.env.PORT ?? "3001", 10);

// API Key from environment variable
const API_KEY = process.env.API_KEY;

const app = createMcpExpressApp({ host: "0.0.0.0" });
app.use(cors());

/**
 * API Key validation middleware
 * Checks for API key in:
 * 1. Authorization header: "Bearer YOUR_KEY"
 * 2. Query parameter: ?apiKey=YOUR_KEY
 */
function validateApiKey(req: Request, res: Response, next: NextFunction) {
  // Skip validation if no API_KEY is configured
  if (!API_KEY) {
    return next();
  }

  // Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    if (token === API_KEY) {
      return next();
    }
  }

  // Check query parameter
  const queryKey = req.query.apiKey as string;
  if (queryKey === API_KEY) {
    return next();
  }

  // Unauthorized
  res.status(401).json({
    jsonrpc: "2.0",
    error: { code: -32001, message: "Unauthorized: Invalid or missing API key" },
    id: null,
  });
}

// Health check endpoint (no auth required)
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", apps: apps.map(a => a.id) });
});

// Home page - list all available apps (no auth required)
app.get("/", (_req: Request, res: Response) => {
  const appList = apps.map(a => ({
    id: a.id,
    name: a.name,
    description: a.description,
    endpoint: `/${a.id}/mcp`,
  }));
  
  res.json({
    name: "MCP App Store",
    version: "1.0.0",
    apps: appList,
  });
});

// Handle POST requests for each app: /{app-id}/mcp
app.post("/:appId/mcp", validateApiKey, async (req: Request, res: Response) => {
  const appDef = getApp(req.params.appId as string);
  
  if (!appDef) {
    res.status(404).json({
      jsonrpc: "2.0",
      error: { code: -32000, message: `App not found: ${req.params.appId}` },
      id: null,
    });
    return;
  }

  const server = appDef.createServer();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });

  res.on("close", () => {
    transport.close().catch(() => {});
    server.close().catch(() => {});
  });

  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error(`MCP error in ${appDef.id}:`, error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: null,
      });
    }
  }
});

// Handle GET/DELETE for app endpoints - return 405
app.get("/:appId/mcp", (_req: Request, res: Response) => {
  res.status(405).set("Allow", "POST").json({
    jsonrpc: "2.0",
    error: { code: -32000, message: "Method not allowed." },
    id: null,
  });
});

app.delete("/:appId/mcp", (_req: Request, res: Response) => {
  res.status(405).json({
    jsonrpc: "2.0",
    error: { code: -32000, message: "Method not allowed." },
    id: null,
  });
});

app.listen(port, () => {
  console.log(`\n🚀 MCP App Store running at http://localhost:${port}`);
  console.log(`\n📦 Available apps:`);
  for (const appDef of apps) {
    console.log(`   - ${appDef.name}: http://localhost:${port}/${appDef.id}/mcp`);
  }
  console.log();
});
