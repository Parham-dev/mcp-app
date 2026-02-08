import { App } from "@modelcontextprotocol/ext-apps";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { createPdfRenderer } from "./pdf-renderer";
import { createSelectionMenu } from "./selection-menu";
import { createContextUpdater } from "./context";
import { loadPdfInChunks } from "./loader";
import { createNotesManager } from "./notes";
import { createHighlightsManager } from "./highlights";
import { createNavigationController } from "./navigation";
import { createLayoutManager } from "./layout";
import {
  els,
  showLoading,
  showError,
  showViewer,
  updateControls,
  updateProgress,
  showRenderWarning,
  hideRenderWarning,
  showNoteDialog,
} from "./ui";
import "./global.css";
import "./mcp-app.css";

const log = {
  info: console.log.bind(console, "[PDF-VIEWER]"),
  error: console.error.bind(console, "[PDF-VIEWER]"),
};

let pdfUrl = "";
let pdfTitle: string | undefined;
let documentId: string | undefined;

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
    notes.renderNotesForPage();
    highlights.applyHighlightsToTextLayer();
    layout.requestFitToContent();
  },
  onError: (message) => {
    log.error("Error rendering page:", message);
    showError("Failed to render page.");
  },
  onRenderWarning: (message) => {
    showRenderWarning(message);
  },
});

const nav = createNavigationController({
  app,
  renderer,
  pageInputEl: els.pageInputEl,
  canvasContainerEl: els.canvasContainerEl,
  mainEl: els.mainEl,
  fullscreenBtn: els.fullscreenBtn,
});

const layout = createLayoutManager({
  app,
  canvasEl: els.canvasEl,
  getDisplayMode: () => nav.getDisplayMode(),
  setDisplayMode: (mode) => nav.setDisplayMode(mode),
});

const notes = createNotesManager({
  app,
  getDocumentId: () => documentId,
  getRenderer: () => renderer,
});

const highlights = createHighlightsManager({
  app,
  getDocumentId: () => documentId,
  getRenderer: () => renderer,
  highlightLayerEl: els.highlightLayerEl,
  textLayerEl: els.textLayerEl,
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
  onNote: async (text) => {
    if (!documentId) return;
    const noteText = await showNoteDialog(text);
    if (!noteText) return;
    const { currentPage } = renderer.getState();
    await notes.saveNote({ page: currentPage, selectionText: text, noteText });
  },
  onHighlight: async (text) => {
    if (!documentId) return;
    const { currentPage } = renderer.getState();
    await highlights.saveHighlight({ page: currentPage, selectionText: text });
  },
  onSelectionChange: () => updatePageContext(),
});

const updatePageContext = createContextUpdater({
  app,
  renderer,
  selectionMenu,
  getPdfMeta: () => ({ pdfUrl, pdfTitle }),
});

// Render warning buttons
els.renderWarningCloseEl.addEventListener("click", () => {
  hideRenderWarning();
});

els.renderWarningOpenEl.addEventListener("click", () => {
  hideRenderWarning();
  if (pdfUrl) {
    app.openLink({ url: pdfUrl });
  }
});

// Toolbar button listeners
els.prevBtn.addEventListener("click", () => nav.prevPage());
els.nextBtn.addEventListener("click", () => nav.nextPage());
els.zoomOutBtn.addEventListener("click", () => renderer.zoomOut());
els.zoomInBtn.addEventListener("click", () => renderer.zoomIn());
els.fullscreenBtn.addEventListener("click", () => nav.toggleFullscreen());

els.pageInputEl.addEventListener("change", () => {
  const page = parseInt(els.pageInputEl.value, 10);
  if (!isNaN(page)) {
    nav.goToPage(page);
  } else {
    els.pageInputEl.value = String(renderer.getState().currentPage);
  }
});

els.pageInputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    els.pageInputEl.blur();
  }
});

function parseToolResult(result: CallToolResult): {
  url: string;
  title?: string;
  pageCount: number;
  initialPage: number;
  documentId: string;
} | null {
  return result.structuredContent as {
    url: string;
    title?: string;
    pageCount: number;
    initialPage: number;
    documentId: string;
  } | null;
}

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
  nav.setViewUUID(result._meta?.viewUUID ? String(result._meta.viewUUID) : undefined);
  documentId = parsed.documentId;

  const savedPage = nav.loadSavedPage();
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
    await Promise.all([notes.loadNotes(), highlights.loadHighlights()]);
  } catch (err) {
    log.error("Error loading PDF:", err);
    showError(err instanceof Error ? err.message : String(err));
  }
};

app.onerror = (err) => {
  log.error("App error:", err);
  showError(err instanceof Error ? err.message : String(err));
};

app.onhostcontextchanged = (ctx) => layout.handleHostContextChanged(ctx);

app.connect().then(() => {
  log.info("Connected to host");
  const ctx = app.getHostContext();
  if (ctx) {
    layout.handleHostContextChanged(ctx);
  }
});
