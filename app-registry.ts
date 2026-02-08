/**
 * App Registry - Central registry for all MCP apps
 * Add your app here to include it in the deployment
 */

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export interface AppDefinition {
  id: string;
  name: string;
  description: string;
  createServer: () => McpServer;
}

// Import all apps
import * as recipeRemix from "./apps/recipe-remix/server.js";
import * as allocationRemix from "./apps/allocation-remix/server.js";
import * as pdfInsight from "./apps/pdf-insight/server.js";

// Register all apps here
export const apps: AppDefinition[] = [
  {
    id: recipeRemix.appId,
    name: recipeRemix.appName,
    description: recipeRemix.appDescription,
    createServer: recipeRemix.createServer,
  },
  {
    id: allocationRemix.appId,
    name: allocationRemix.appName,
    description: allocationRemix.appDescription,
    createServer: allocationRemix.createServer,
  },
  {
    id: pdfInsight.appId,
    name: pdfInsight.appName,
    description: pdfInsight.appDescription,
    createServer: pdfInsight.createServer,
  },
  // Add more apps here:
  // {
  //   id: weather.appId,
  //   name: weather.appName,
  //   description: weather.appDescription,
  //   createServer: weather.createServer,
  // },
];

export function getApp(id: string): AppDefinition | undefined {
  return apps.find(app => app.id === id);
}
