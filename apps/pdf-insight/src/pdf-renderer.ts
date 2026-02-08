import * as pdfjsLib from "pdfjs-dist";
import { TextLayer } from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

export const ZOOM_LEVELS = [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5, 3] as const;
export const DEFAULT_ZOOM = 1;

export type PdfRenderer = ReturnType<typeof createPdfRenderer>;

export function createPdfRenderer(params: {
  canvasEl: HTMLCanvasElement;
  textLayerEl: HTMLElement;
  onRendered?: (state: { page: number; totalPages: number; scale: number }) => void;
  onError?: (message: string) => void;
}) {
  const { canvasEl, textLayerEl, onRendered, onError } = params;

  let pdfDocument: pdfjsLib.PDFDocumentProxy | null = null;
  let currentPage = 1;
  let totalPages = 0;
  let scale = DEFAULT_ZOOM;
  let currentRenderTask: { cancel: () => void } | null = null;
  let isRendering = false;
  let pendingPage: number | null = null;

  async function load(bytes: Uint8Array) {
    pdfDocument = await pdfjsLib.getDocument({ data: bytes }).promise;
    totalPages = pdfDocument.numPages;
  }

  function getState() {
    return { currentPage, totalPages, scale };
  }

  function setPage(page: number) {
    if (!pdfDocument) return;
    const next = Math.max(1, Math.min(page, totalPages));
    if (next !== currentPage) {
      currentPage = next;
      renderPage();
    }
  }

  function setScale(nextScale: number) {
    scale = nextScale;
    renderPage();
  }

  function zoomIn() {
    const index = ZOOM_LEVELS.findIndex((level) => level >= scale);
    const nextIndex = index === -1 ? 0 : Math.min(index + 1, ZOOM_LEVELS.length - 1);
    if (scale !== ZOOM_LEVELS[nextIndex]) {
      setScale(ZOOM_LEVELS[nextIndex]);
    }
  }

  function zoomOut() {
    const index = ZOOM_LEVELS.findIndex((level) => level >= scale);
    const safeIndex = index === -1 ? ZOOM_LEVELS.length - 1 : index;
    const nextIndex = Math.max(safeIndex - 1, 0);
    if (scale !== ZOOM_LEVELS[nextIndex]) {
      setScale(ZOOM_LEVELS[nextIndex]);
    }
  }

  function resetZoom() {
    if (scale !== DEFAULT_ZOOM) {
      setScale(DEFAULT_ZOOM);
    }
  }

  async function getPageText(pageNumber: number): Promise<string> {
    if (!pdfDocument) return "";
    const page = await pdfDocument.getPage(pageNumber);
    const textContent = await page.getTextContent();
    return (textContent.items as Array<{ str?: string }> )
      .map((item) => item.str || "")
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();
  }

  async function renderPage() {
    if (!pdfDocument) return;

    if (isRendering) {
      pendingPage = currentPage;
      if (currentRenderTask) {
        currentRenderTask.cancel();
      }
      return;
    }

    isRendering = true;
    pendingPage = null;

    try {
      const pageToRender = currentPage;
      const page = await pdfDocument.getPage(pageToRender);
      const viewport = page.getViewport({ scale });

      const dpr = window.devicePixelRatio || 1;
      const ctx = canvasEl.getContext("2d");
      if (!ctx) return;

      canvasEl.width = viewport.width * dpr;
      canvasEl.height = viewport.height * dpr;
      canvasEl.style.width = `${viewport.width}px`;
      canvasEl.style.height = `${viewport.height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      textLayerEl.innerHTML = "";
      textLayerEl.style.width = `${viewport.width}px`;
      textLayerEl.style.height = `${viewport.height}px`;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const renderTask = (page.render as any)({ canvasContext: ctx, viewport });
      currentRenderTask = renderTask;

      try {
        await renderTask.promise;
      } catch (renderErr) {
        if (
          renderErr instanceof Error &&
          renderErr.name === "RenderingCancelledException"
        ) {
          return;
        }
        throw renderErr;
      } finally {
        currentRenderTask = null;
      }

      if (pageToRender !== currentPage) {
        return;
      }

      const textContent = await page.getTextContent();
      const textLayer = new TextLayer({
        textContentSource: textContent,
        container: textLayerEl,
        viewport,
        enhanceTextSelection: true,
      } as unknown as ConstructorParameters<typeof TextLayer>[0]);
      await textLayer.render();

      onRendered?.({ page: currentPage, totalPages, scale });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      onError?.(message);
    } finally {
      isRendering = false;

      if (pendingPage !== null && pendingPage !== currentPage) {
        currentPage = pendingPage;
        renderPage();
      } else if (pendingPage === currentPage) {
        renderPage();
      }
    }
  }

  return {
    load,
    renderPage,
    getState,
    setPage,
    zoomIn,
    zoomOut,
    resetZoom,
    getPageText,
    setScale,
  };
}
