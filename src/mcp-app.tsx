/**
 * MCP App Template - React UI Component
 * Demonstrates useApp hook, lifecycle handlers, and host styling.
 */
import type { App, McpUiHostContext } from "@modelcontextprotocol/ext-apps";
import { useApp, useHostStyles } from "@modelcontextprotocol/ext-apps/react";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { StrictMode, useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import styles from "./mcp-app.module.css";

interface StructuredContent {
  greeting: string;
  name: string;
  timestamp: string;
}

function extractStructuredContent(result: CallToolResult): StructuredContent | null {
  const structured = result.structuredContent as StructuredContent | undefined;
  return structured ?? null;
}

function McpApp() {
  const [toolResult, setToolResult] = useState<CallToolResult | null>(null);
  const [toolInput, setToolInput] = useState<{ name?: string } | null>(null);
  const [hostContext, setHostContext] = useState<McpUiHostContext | undefined>();

  // useApp creates an App instance, registers handlers, and calls connect()
  const { app, error } = useApp({
    appInfo: { name: "MCP App Template", version: "1.0.0" },
    capabilities: {},
    onAppCreated: (app) => {
      // Register all handlers BEFORE connect() is called

      app.onteardown = async () => {
        console.info("App is being torn down");
        return {};
      };

      app.ontoolinput = async (input) => {
        console.info("Received tool input:", input);
        setToolInput(input.arguments as { name?: string });
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

  // Apply host styles (theme, CSS variables, fonts)
  useHostStyles(app);

  // Apply theme class to document for CSS dark mode support
  useEffect(() => {
    if (hostContext?.theme) {
      document.documentElement.setAttribute('data-theme', hostContext.theme);
      if (hostContext.theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
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
        <div className={styles.loading}>Connecting...</div>
      </div>
    );
  }

  return (
    <McpAppInner
      app={app}
      toolInput={toolInput}
      toolResult={toolResult}
      hostContext={hostContext}
    />
  );
}

interface McpAppInnerProps {
  app: App;
  toolInput: { name?: string } | null;
  toolResult: CallToolResult | null;
  hostContext?: McpUiHostContext;
}

function McpAppInner({ app, toolInput, toolResult, hostContext }: McpAppInnerProps) {
  const [data, setData] = useState<StructuredContent | null>(null);

  useEffect(() => {
    if (toolResult) {
      const structured = extractStructuredContent(toolResult);
      setData(structured);
    }
  }, [toolResult]);

  // Example: Call the tool again from the UI
  const handleRefresh = useCallback(async () => {
    try {
      const result = await app.callServerTool({
        name: "hello-world",
        arguments: { name: toolInput?.name || "World" },
      });
      setData(extractStructuredContent(result));
    } catch (e) {
      console.error("Failed to refresh:", e);
    }
  }, [app, toolInput]);

  // Example: Send a message to the chat
  const handleSendMessage = useCallback(async () => {
    try {
      await app.sendMessage({
        role: "user",
        content: [{ type: "text", text: `The current greeting is: ${data?.greeting}` }],
      });
    } catch (e) {
      console.error("Failed to send message:", e);
    }
  }, [app, data]);

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>MCP App Template</h1>
        <p className={styles.subtitle}>
          Theme: {hostContext?.theme ?? "unknown"}
        </p>
      </header>

      <main className={styles.main}>
        {data ? (
          <div className={styles.card}>
            <h2 className={styles.greeting}>{data.greeting}</h2>
            <p className={styles.meta}>
              Name: <strong>{data.name}</strong>
            </p>
            <p className={styles.meta}>
              Timestamp: <code>{data.timestamp}</code>
            </p>
          </div>
        ) : (
          <div className={styles.card}>
            <p className={styles.placeholder}>Waiting for tool result...</p>
          </div>
        )}

        <div className={styles.actions}>
          <button className={styles.button} onClick={handleRefresh}>
            Refresh
          </button>
          <button
            className={styles.buttonSecondary}
            onClick={handleSendMessage}
            disabled={!data}
          >
            Send to Chat
          </button>
        </div>
      </main>
    </div>
  );
}

// Mount the app
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <McpApp />
  </StrictMode>
);
