import type { App, McpUiHostContext } from "@modelcontextprotocol/ext-apps";
import { applyDocumentTheme, applyHostStyleVariables } from "@modelcontextprotocol/ext-apps";
import { applySafeAreaInsets } from "./ui";

export type LayoutManager = ReturnType<typeof createLayoutManager>;

export function createLayoutManager(deps: {
  app: App;
  canvasEl: HTMLCanvasElement;
  getDisplayMode: () => "inline" | "fullscreen";
  setDisplayMode: (mode: "inline" | "fullscreen") => void;
}) {
  const { app, canvasEl, getDisplayMode, setDisplayMode } = deps;

  function requestFitToContent() {
    if (getDisplayMode() === "fullscreen") return;

    const canvasHeight = canvasEl.height;
    if (canvasHeight <= 0) return;

    const canvasContainerEl = document.querySelector(
      ".canvas-container",
    ) as HTMLElement;
    const pageWrapperEl = document.querySelector(".page-wrapper") as HTMLElement;
    const toolbarEl = document.querySelector(".toolbar") as HTMLElement;

    if (!canvasContainerEl || !toolbarEl || !pageWrapperEl) return;

    const containerStyle = getComputedStyle(canvasContainerEl);
    const paddingTop = parseFloat(containerStyle.paddingTop);
    const paddingBottom = parseFloat(containerStyle.paddingBottom);
    const toolbarHeight = toolbarEl.offsetHeight;
    const pageWrapperHeight = pageWrapperEl.offsetHeight;
    const BUFFER = 10;
    const totalHeight =
      toolbarHeight + paddingTop + pageWrapperHeight + paddingBottom + BUFFER;

    app.sendSizeChanged({ height: totalHeight });
  }

  function handleHostContextChanged(ctx: McpUiHostContext) {
    if (ctx.theme) applyDocumentTheme(ctx.theme);
    if (ctx.styles?.variables) applyHostStyleVariables(ctx.styles.variables);
    if (ctx.safeAreaInsets) applySafeAreaInsets(ctx.safeAreaInsets);

    if (ctx.displayMode) {
      const wasFullscreen = getDisplayMode() === "fullscreen";
      setDisplayMode(ctx.displayMode as "inline" | "fullscreen");
      const isFullscreen = getDisplayMode() === "fullscreen";
      if (wasFullscreen && !isFullscreen) requestFitToContent();
    }
  }

  return { requestFitToContent, handleHostContextChanged };
}
