/**
 * Allocation Remix MCP Server
 *
 * A dynamic allocation visualizer that works for any resource allocation scenario.
 * The AI provides categories, amounts, and optional benchmarks/history.
 */
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type {
  CallToolResult,
  ReadResourceResult,
} from "@modelcontextprotocol/sdk/types.js";
import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";
import {
  RESOURCE_MIME_TYPE,
  registerAppResource,
  registerAppTool,
} from "@modelcontextprotocol/ext-apps/server";

// App metadata exports
export const appId = "allocation-remix";
export const appName = "Allocation Remix";
export const appDescription = "Dynamic resource allocation visualizer for budgets, time, teams, and more";

// Path to the built HTML file
const HTML_PATH = path.join(import.meta.dirname, "../../dist/apps/allocation-remix/mcp-app.html");

// ---------------------------------------------------------------------------
// Schemas - Dynamic Input from AI
// ---------------------------------------------------------------------------

const CategorySchema = z.object({
  id: z.string().describe("Unique identifier for the category"),
  name: z.string().describe("Display name for the category"),
  color: z.string().describe("Hex color code (e.g., '#3b82f6')"),
  defaultPercent: z.number().min(0).max(100).describe("Default allocation percentage"),
});

const HistoricalMonthSchema = z.object({
  month: z.string().describe("Month identifier (e.g., '2024-01')"),
  allocations: z.record(z.string(), z.number()).describe("Category ID to percentage mapping"),
});

const BenchmarkPercentilesSchema = z.object({
  p25: z.number().describe("25th percentile value"),
  p50: z.number().describe("50th percentile (median) value"),
  p75: z.number().describe("75th percentile value"),
});

const StageBenchmarkSchema = z.object({
  stage: z.string().describe("Stage or segment name (e.g., 'Seed', 'Small Team', 'Personal')"),
  categoryBenchmarks: z.record(z.string(), BenchmarkPercentilesSchema).describe("Benchmarks per category"),
});

// Main input schema - AI provides everything
const AllocationInputSchema = z.object({
  title: z.string().describe("Title for the allocation (e.g., 'Monthly Budget', 'Project Resources')"),
  totalAmount: z.number().describe("Total amount to allocate"),
  currency: z.string().default("USD").describe("Currency code or unit type (USD, hours, points, etc.)"),
  currencySymbol: z.string().default("$").describe("Symbol to display (e.g., '$', 'hrs', 'pts')"),
  categories: z.array(CategorySchema).min(2).max(10).describe("2-10 allocation categories"),
  presetAmounts: z.array(z.number()).optional().describe("Optional preset amounts for quick selection"),
  history: z.array(HistoricalMonthSchema).optional().describe("Optional historical allocation data"),
  benchmarks: z.array(StageBenchmarkSchema).optional().describe("Optional industry/reference benchmarks"),
  stages: z.array(z.string()).optional().describe("Stage names if benchmarks provided"),
  defaultStage: z.string().optional().describe("Default stage to show"),
});

type AllocationInput = z.infer<typeof AllocationInputSchema>;

// ---------------------------------------------------------------------------
// Response Formatting
// ---------------------------------------------------------------------------

function formatAllocationSummary(input: AllocationInput): string {
  const lines: string[] = [
    `${input.title}`,
    "=".repeat(input.title.length),
    "",
    `Total: ${input.currencySymbol}${input.totalAmount.toLocaleString()}`,
  ];

  if (input.presetAmounts && input.presetAmounts.length > 0) {
    lines.push(
      `Presets: ${input.presetAmounts.map((a) => `${input.currencySymbol}${a.toLocaleString()}`).join(", ")}`
    );
  }

  lines.push("", "Categories:");
  for (const cat of input.categories) {
    lines.push(`  - ${cat.name}: ${cat.defaultPercent}% default`);
  }

  if (input.history) {
    lines.push("", `Historical Data: ${input.history.length} periods`);
  }

  if (input.benchmarks && input.stages) {
    lines.push(`Benchmarks: ${input.stages.join(", ")}`);
  }

  return lines.join("\n");
}

// ---------------------------------------------------------------------------
// MCP Server Setup
// ---------------------------------------------------------------------------

const resourceUri = "ui://allocation-remix/mcp-app.html";

/**
 * Creates a new MCP server instance with tools and resources registered.
 */
export function createServer(): McpServer {
  const server = new McpServer({
    name: "Allocation Remix",
    version: "1.0.0",
  });

  registerAppTool(
    server,
    "show-allocation",
    {
      title: "Show Allocation",
      description:
        "Display an interactive allocation visualizer for any resource type (budget, time, team, etc.). " +
        "Provide categories with percentages, total amount, and optional historical data or benchmarks. " +
        "Examples: Monthly budget allocation, project resource planning, time management, marketing budget breakdown.",
      inputSchema: AllocationInputSchema,
      _meta: { ui: { resourceUri } },
    },
    async (args): Promise<CallToolResult> => {
      const allocation = AllocationInputSchema.parse(args);

      // Transform input to match client expectations
      const response = {
        config: {
          categories: allocation.categories,
          presetBudgets: allocation.presetAmounts || [
            Math.floor(allocation.totalAmount * 0.5),
            allocation.totalAmount,
            Math.floor(allocation.totalAmount * 2.5),
            Math.floor(allocation.totalAmount * 5),
          ],
          defaultBudget: allocation.totalAmount,
          currency: allocation.currency,
          currencySymbol: allocation.currencySymbol,
          title: allocation.title,
        },
        analytics: {
          history: allocation.history || [],
          benchmarks: allocation.benchmarks || [],
          stages: allocation.stages || [],
          defaultStage: allocation.defaultStage || (allocation.stages?.[0] ?? ""),
        },
      };

      return {
        content: [
          {
            type: "text",
            text: formatAllocationSummary(allocation),
          },
        ],
        structuredContent: response,
      };
    },
  );

  registerAppResource(
    server,
    resourceUri,
    resourceUri,
    {
      mimeType: RESOURCE_MIME_TYPE,
      description: "Interactive Allocation Remix UI",
    },
    async (): Promise<ReadResourceResult> => {
      const html = await fs.readFile(HTML_PATH, "utf-8");
      return {
        contents: [
          { uri: resourceUri, mimeType: RESOURCE_MIME_TYPE, text: html },
        ],
      };
    },
  );

  return server;
}
