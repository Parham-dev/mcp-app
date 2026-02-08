import type { App } from "@modelcontextprotocol/ext-apps";
import type { PdfRenderer } from "./pdf-renderer";
import { updateFullscreenButton } from "./ui";

const log = {
  info: console.log.bind(console, "[PDF-VIEWER]"),
  error: console.error.bind(console, "[PDF-VIEWER]"),
};

export type NavigationController = ReturnType<typeof createNavigationController>;

export function createNavigationController(deps: {
  app: App;
  renderer: PdfRenderer;
  pageInputEl: HTMLInputElement;
  canvasContainerEl: HTMLElement;
  mainEl: HTMLElement;
  fullscreenBtn: HTMLButtonElement;
}) {
  const {
    app,
    renderer,
    pageInputEl,
    canvasContainerEl,
    mainEl,
  } = deps;

  let currentDisplayMode: "inline" | "fullscreen" = "inline";
  let viewUUID: string | undefined;
  let horizontalScrollAccumulator = 0;
  const SCROLL_THRESHOLD = 50;

  function goToPage(page: number) {
    renderer.setPage(page);
    saveCurrentPage();
    pageInputEl.value = String(renderer.getState().currentPage);
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

  function setViewUUID(uuid: string | undefined) {
    viewUUID = uuid;
  }

  function setDisplayMode(mode: "inline" | "fullscreen") {
    currentDisplayMode = mode;
    mainEl.classList.toggle("fullscreen", mode === "fullscreen");
    updateFullscreenButton(mode === "fullscreen");
  }

  function getDisplayMode(): "inline" | "fullscreen" {
    return currentDisplayMode;
  }

  // Keyboard navigation
  document.addEventListener("keydown", (e) => {
    const active = document.activeElement;
    if (active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement) return;
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
  canvasContainerEl.addEventListener(
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

  return {
    goToPage,
    prevPage,
    nextPage,
    toggleFullscreen,
    saveCurrentPage,
    loadSavedPage,
    setViewUUID,
    setDisplayMode,
    getDisplayMode,
  };
}
