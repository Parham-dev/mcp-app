import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { CallToolResult, ReadResourceResult } from "@modelcontextprotocol/sdk/types.js";
import fs from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

// App metadata exports
export const appId = "recipe-remix";
export const appName = "Recipe Remix";
export const appDescription = "AI-powered recipe assistant with beautiful UI";

// Path to the built HTML file
const HTML_PATH = path.join(import.meta.dirname, "../../dist/apps/recipe-remix/mcp-app.html");

// Ingredient schema with category for emoji icons
const IngredientSchema = z.object({
  name: z.string().describe("Ingredient name"),
  amount: z.number().describe("Amount for base servings"),
  unit: z.string().describe("Unit of measurement (g, ml, cups, tbsp, pcs, etc.)"),
  category: z.enum(["protein", "vegetable", "dairy", "grain", "spice", "sauce", "other"])
    .optional()
    .describe("Category for emoji icon"),
});

// Step schema
const StepSchema = z.object({
  instruction: z.string().describe("Step instruction"),
  duration: z.number().optional().describe("Duration in minutes (if applicable)"),
});

// Main recipe input schema
const RecipeInputSchema = z.object({
  name: z.string().describe("Recipe name"),
  description: z.string().optional().describe("Brief description of the dish"),
  servings: z.number().default(4).describe("Number of servings"),
  prepTime: z.number().optional().describe("Prep time in minutes"),
  cookTime: z.number().optional().describe("Cook time in minutes"),
  ingredients: z.array(IngredientSchema).describe("List of ingredients"),
  steps: z.array(StepSchema).describe("Cooking steps"),
  notes: z.string().optional().describe("Additional notes or tips"),
  healthScore: z.number().min(0).max(10).describe("REQUIRED: Health rating from 0 (indulgent/unhealthy like fried food, desserts) to 10 (very healthy like salads, lean proteins). Always provide this value."),
});

/**
 * Creates a new MCP server instance with tools and resources registered.
 */
export function createServer(): McpServer {
  const server = new McpServer({
    name: "Recipe Remix",
    version: "1.0.0",
  });

  // Two-part registration: tool + resource, tied together by the resource URI.
  const resourceUri = "ui://recipe-remix/mcp-app.html";

  // Register a tool with UI metadata. When the host calls this tool, it reads
  // `_meta.ui.resourceUri` to know which resource to fetch and render as an
  // interactive UI.
  registerAppTool(server,
    "show-recipe",
    {
      title: "Recipe Remix",
      description: "Display a recipe with beautiful UI. AI provides the full recipe (name, ingredients, steps) and the app renders it with interactive features like servings adjustment.",
      inputSchema: RecipeInputSchema,
      _meta: { ui: { resourceUri } }, // Links this tool to its UI resource
    },
    async (args): Promise<CallToolResult> => {
      const recipe = RecipeInputSchema.parse(args);
      
      // Create a text summary for the model
      const ingredientsList = recipe.ingredients
        .map(i => `- ${i.amount} ${i.unit} ${i.name}`)
        .join("\n");
      const stepsList = recipe.steps
        .map((s, i) => `${i + 1}. ${s.instruction}`)
        .join("\n");
      
      const summary = `Recipe: ${recipe.name}
Servings: ${recipe.servings}
${recipe.prepTime ? `Prep: ${recipe.prepTime} min` : ""}
${recipe.cookTime ? `Cook: ${recipe.cookTime} min` : ""}

Ingredients:
${ingredientsList}

Steps:
${stepsList}`;
      
      return {
        content: [{ type: "text", text: summary }],
        // structuredContent is available to the UI but not sent to the model
        structuredContent: recipe,
      };
    },
  );

  // Register the resource, which returns the bundled HTML/JavaScript for the UI.
  registerAppResource(server,
    resourceUri,
    resourceUri,
    { mimeType: RESOURCE_MIME_TYPE },
    async (): Promise<ReadResourceResult> => {
      const html = await fs.readFile(HTML_PATH, "utf-8");
      return {
        contents: [{ uri: resourceUri, mimeType: RESOURCE_MIME_TYPE, text: html }],
      };
    },
  );

  return server;
}
