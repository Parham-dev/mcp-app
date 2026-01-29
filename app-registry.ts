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

// Register all apps here
export const apps: AppDefinition[] = [
  {
    id: recipeRemix.appId,
    name: recipeRemix.appName,
    description: recipeRemix.appDescription,
    createServer: recipeRemix.createServer,
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
