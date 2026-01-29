/**
 * Recipe Remix - MCP App
 * AI-powered recipe assistant with beautiful UI and smart interactions.
 */
import type { App, McpUiHostContext } from "@modelcontextprotocol/ext-apps";
import { useApp, useHostStyles } from "@modelcontextprotocol/ext-apps/react";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { StrictMode, useCallback, useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";

import {
  EmptyState,
  IngredientList,
  RecipeHeader,
  ServingsSlider,
  StepsList,
} from "./src/components";
import { LoadingAnimation } from "./src/components/LoadingAnimation";
import type { Recipe, ScaledIngredient } from "./src/types/recipe";
import styles from "./mcp-app.module.css";

// Extract recipe from tool result
function extractRecipe(result: CallToolResult): Recipe | null {
  const structured = result.structuredContent as Recipe | undefined;
  return structured ?? null;
}

// Main MCP App - handles connection and lifecycle
function McpApp() {
  const [toolResult, setToolResult] = useState<CallToolResult | null>(null);
  const [hostContext, setHostContext] = useState<McpUiHostContext | undefined>();

  const { app, error } = useApp({
    appInfo: { name: "Recipe Remix", version: "1.0.0" },
    capabilities: {},
    onAppCreated: (app) => {
      app.onteardown = async () => {
        console.info("App is being torn down");
        return {};
      };

      app.ontoolinput = async (input) => {
        console.info("Received tool input:", input);
      };

      app.ontoolresult = async (result) => {
        console.info("Received tool result:", result);
        setToolResult(result);
      };

      app.ontoolcancelled = (params) => {
        console.info("Tool call cancelled:", params.reason);
      };

      app.onerror = console.error;

      app.onhostcontextchanged = (params) => {
        setHostContext((prev) => ({ ...prev, ...params }));
      };
    },
  });

  useHostStyles(app);

  // Apply theme to document
  useEffect(() => {
    if (hostContext?.theme) {
      document.documentElement.setAttribute("data-theme", hostContext.theme);
      if (hostContext.theme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    }
  }, [hostContext?.theme]);

  useEffect(() => {
    if (app) {
      setHostContext(app.getHostContext());
    }
  }, [app]);

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <strong>Error:</strong> {error.message}
        </div>
      </div>
    );
  }

  if (!app) {
    return (
      <div className={styles.container}>
        <LoadingAnimation message="Connecting..." />
      </div>
    );
  }

  return <RecipeApp app={app} toolResult={toolResult} />;
}

// Recipe App - displays recipe UI
interface RecipeAppProps {
  app: App;
  toolResult: CallToolResult | null;
}

function RecipeApp({ app, toolResult }: RecipeAppProps) {
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  const [currentServings, setCurrentServings] = useState<number>(4);

  // Extract recipe from tool result
  useEffect(() => {
    if (toolResult) {
      const extracted = extractRecipe(toolResult);
      if (extracted) {
        setRecipe(extracted);
        setCurrentServings(extracted.servings);
      }
    }
  }, [toolResult]);

  // Calculate scaled ingredients
  const scaledIngredients: ScaledIngredient[] = useMemo(() => {
    if (!recipe) return [];
    const scale = currentServings / recipe.servings;
    return recipe.ingredients.map((ing) => ({
      ...ing,
      scaledAmount: Math.round(ing.amount * scale * 100) / 100,
    }));
  }, [recipe, currentServings]);

  // Send message to AI for substitution - ask AI to update the recipe
  const handleSubstitute = useCallback(
    async (ingredientName: string) => {
      try {
        await app.sendMessage({
          role: "user",
          content: [
            { 
              type: "text", 
              text: `I want to substitute "${ingredientName}" in this recipe. Please suggest an alternative and then call the show-recipe tool again with the updated ingredient so I can see the changes.` 
            },
          ],
        });
      } catch (e) {
        console.error("Failed to send message:", e);
      }
    },
    [app]
  );

  // Send message to AI for step explanation
  const handleExplainStep = useCallback(
    async (stepInstruction: string) => {
      try {
        await app.sendMessage({
          role: "user",
          content: [
            { type: "text", text: `Can you explain this step in more detail: "${stepInstruction}"` },
          ],
        });
      } catch (e) {
        console.error("Failed to send message:", e);
      }
    },
    [app]
  );

  if (!recipe) {
    return <EmptyState />;
  }

  return (
    <div className={styles.container}>
      <RecipeHeader recipe={recipe} />

      <ServingsSlider value={currentServings} onChange={setCurrentServings} />

      <IngredientList ingredients={scaledIngredients} onSubstitute={handleSubstitute} />

      <StepsList steps={recipe.steps} onExplain={handleExplainStep} />

      {/* Notes */}
      {recipe.notes && (
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>📝 Notes</h2>
          <p className={styles.notes}>{recipe.notes}</p>
        </section>
      )}
    </div>
  );
}

// Mount the app
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <McpApp />
  </StrictMode>
);
