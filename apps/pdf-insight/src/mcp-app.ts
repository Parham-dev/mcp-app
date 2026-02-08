import {
  App,
  type McpUiHostContext,
  applyDocumentTheme,
  applyHostStyleVariables,
} from "@modelcontextprotocol/ext-apps";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { createPdfRenderer } from "./pdf-renderer";
import { createSelectionMenu } from "./selection-menu";
import { createContextUpdater } from "./context";
import { loadPdfInChunks } from "./loader";
import {
  els,
  showLoading,
  showError,
  showViewer,
  updateControls,
  updateProgress,
  updateFullscreenButton,
  applySafeAreaInsets,
} from "./ui";
import "./global.css";
import "./mcp-app.css";

const log = {
  info: console.log.bind(console, "[PDF-VIEWER]"),
  error: console.error.bind(console, "[PDF-VIEWER]"),
};

let pdfUrl = "";
let pdfTitle: string | undefined;
let viewUUID: string | undefined;
let currentDisplayMode: "inline" | "fullscreen" = "inline";

const app = new App(
  { name: "PDF Viewer", version: "1.0.0" },
  {},
  { autoResize: false },
);

const renderer = createPdfRenderer({
  canvasEl: els.canvasEl,
  textLayerEl: els.textLayerEl,
  onRendered: ({ page, totalPages, scale }) => {
    updateControls({
      pdfUrl,
      currentPage: page,
      totalPages,
      scale,
      onOpenLink: (url) => app.openLink({ url }),
    });
    updatePageContext();
    requestFitToContent();
  },
  onError: (message) => {
    log.error("Error rendering page:", message);
    showError("Failed to render page.");
  },
});

const selectionMenu = createSelectionMenu({
  viewerEl: els.viewerEl,
  mainEl: els.mainEl,
  menuEl: els.selectionMenuEl,
  onExplain: async (text) => {
    await app.sendMessage({
      role: "user",
      content: [{ type: "text", text: `Explain the selected text:\n\n${text}` }],
    });
  },
  onSelectionChange: () => updatePageContext(),
});

const updatePageContext = createContextUpdater({
  app,
  renderer,
  selectionMenu,
  getPdfMeta: () => ({ pdfUrl, pdfTitle }),
});

function requestFitToContent() {
  if (currentDisplayMode === "fullscreen") return;

  const canvasHeight = els.canvasEl.height;
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

function saveCurrentPage() {
  const { currentPage } = renderer.getState();
  if (viewUUID) {
    try {
      localStorage.setItem(viewUUID, String(currentPage));
    } catch (err) {
      log.error("saveCurrentPage error", err);
    }
  }
}

function loadSavedPage(): number | null {
  if (!viewUUID) return null;
  try {
    const saved = localStorage.getItem(viewUUID);
    if (saved) {
      const page = parseInt(saved, 10);
      if (!isNaN(page) && page >= 1) {
        return page;
      }
    }
  } catch (err) {
    log.error("loadSavedPage error", err);
  }
  return null;
}

function goToPage(page: number) {
  renderer.setPage(page);
  saveCurrentPage();
  els.pageInputEl.value = String(renderer.getState().currentPage);
}

function prevPage() {
  const { currentPage } = renderer.getState();
  goToPage(currentPage - 1);
}

function nextPage() {
  const { currentPage } = renderer.getState();
  goToPage(currentPage + 1);
}

async function toggleFullscreen() {
  const ctx = app.getHostContext();
  if (!ctx?.availableDisplayModes?.includes("fullscreen")) {
    log.info("Fullscreen not available");
    return;
  }

  const newMode = currentDisplayMode === "fullscreen" ? "inline" : "fullscreen";
  try {
    const result = await app.requestDisplayMode({ mode: newMode });
    currentDisplayMode = result.mode as "inline" | "fullscreen";
    updateFullscreenButton(currentDisplayMode === "fullscreen");
  } catch (err) {
    log.error("Failed to change display mode:", err);
  }
}

function handleHostContextChanged(ctx: McpUiHostContext) {
  if (ctx.theme) applyDocumentTheme(ctx.theme);
  if (ctx.styles?.variables) applyHostStyleVariables(ctx.styles.variables);
  if (ctx.safeAreaInsets) applySafeAreaInsets(ctx.safeAreaInsets);

  if (ctx.displayMode) {
    const wasFullscreen = currentDisplayMode === "fullscreen";
    currentDisplayMode = ctx.displayMode as "inline" | "fullscreen";
    const isFullscreen = currentDisplayMode === "fullscreen";
    els.mainEl.classList.toggle("fullscreen", isFullscreen);
    if (wasFullscreen && !isFullscreen) requestFitToContent();
    updateFullscreenButton(isFullscreen);
  }
}

function parseToolResult(result: CallToolResult): {
  url: string;
  title?: string;
  pageCount: number;
  initialPage: number;
} | null {
  return result.structuredContent as {
    url: string;
    title?: string;
    pageCount: number;
    initialPage: number;
  } | null;
}

// UI events
els.prevBtn.addEventListener("click", prevPage);
els.nextBtn.addEventListener("click", nextPage);
els.zoomOutBtn.addEventListener("click", () => renderer.zoomOut());
els.zoomInBtn.addEventListener("click", () => renderer.zoomIn());
els.fullscreenBtn.addEventListener("click", toggleFullscreen);

els.pageInputEl.addEventListener("change", () => {
  const page = parseInt(els.pageInputEl.value, 10);
  if (!isNaN(page)) {
    goToPage(page);
  } else {
    els.pageInputEl.value = String(renderer.getState().currentPage);
  }
});

els.pageInputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    els.pageInputEl.blur();
  }
});

// Keyboard navigation
document.addEventListener("keydown", (e) => {
  if (document.activeElement === els.pageInputEl) return;
  if ((e.ctrlKey || e.metaKey) && e.key === "0") {
    renderer.resetZoom();
    e.preventDefault();
    return;
  }

  switch (e.key) {
    case "Escape":
      if (currentDisplayMode === "fullscreen") {
        toggleFullscreen();
        e.preventDefault();
      }
      break;
    case "ArrowLeft":
    case "PageUp":
      prevPage();
      e.preventDefault();
      break;
    case "ArrowRight":
    case "PageDown":
    case " ":
      nextPage();
      e.preventDefault();
      break;
    case "+":
    case "=":
      renderer.zoomIn();
      e.preventDefault();
      break;
    case "-":
      renderer.zoomOut();
      e.preventDefault();
      break;
  }
});

// Horizontal scroll/swipe to change pages (disabled when zoomed)
let horizontalScrollAccumulator = 0;
const SCROLL_THRESHOLD = 50;

els.canvasContainerEl.addEventListener(
  "wheel",
  (event) => {
    const e = event as WheelEvent;
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    if (renderer.getState().scale > 1.0) return;

    e.preventDefault();
    horizontalScrollAccumulator += e.deltaX;
    if (horizontalScrollAccumulator > SCROLL_THRESHOLD) {
      nextPage();
      horizontalScrollAccumulator = 0;
    } else if (horizontalScrollAccumulator < -SCROLL_THRESHOLD) {
      prevPage();
      horizontalScrollAccumulator = 0;
    }
  },
  { passive: false },
);

// Tool results
app.ontoolresult = async (result) => {
  log.info("Received tool result:", result);

  const parsed = parseToolResult(result);
  if (!parsed) {
    showError("Invalid tool result");
    return;
  }

  pdfUrl = parsed.url;
  pdfTitle = parsed.title;
  viewUUID = result._meta?.viewUUID ? String(result._meta.viewUUID) : undefined;

  const savedPage = loadSavedPage();
  const initialPage =
    savedPage && savedPage <= parsed.pageCount ? savedPage : parsed.initialPage;

  showLoading("Loading PDF...");

  try {
    els.progressContainerEl.style.display = "block";
    const pdfBytes = await loadPdfInChunks(app, pdfUrl, updateProgress);
    showLoading("Rendering PDF...");

    await renderer.load(pdfBytes);
    renderer.setPage(initialPage);

    showViewer();
    renderer.renderPage();
  } catch (err) {
    log.error("Error loading PDF:", err);
    showError(err instanceof Error ? err.message : String(err));
  }
};

app.onerror = (err) => {
  log.error("App error:", err);
  showError(err instanceof Error ? err.message : String(err));
};

app.onhostcontextchanged = handleHostContextChanged;

app.connect().then(() => {
  log.info("Connected to host");
  const ctx = app.getHostContext();
  if (ctx) {
    handleHostContextChanged(ctx);
  }
});
