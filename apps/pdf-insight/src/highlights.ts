import type { App } from "@modelcontextprotocol/ext-apps";
import type { PdfRenderer } from "./pdf-renderer";

export type HighlightsManager = ReturnType<typeof createHighlightsManager>;

export function createHighlightsManager(deps: {
  app: App;
  getDocumentId: () => string | undefined;
  getRenderer: () => PdfRenderer;
  highlightLayerEl: HTMLElement;
  textLayerEl: HTMLElement;
}) {
  const { app, getDocumentId, getRenderer, highlightLayerEl, textLayerEl } = deps;

  let highlightsCache: Array<{
    id: string;
    page: number;
    selectionText: string;
    color?: string | null;
  }> = [];

  async function loadHighlights() {
    const documentId = getDocumentId();
    if (!documentId) {
      highlightsCache = [];
      return;
    }
    const result = await app.callServerTool({
      name: "list_highlights",
      arguments: { documentId },
    });
    if (result.isError || !result.structuredContent) {
      highlightsCache = [];
      return;
    }
    const payload = result.structuredContent as unknown as {
      highlights: Array<{
        id: string;
        page: number;
        selectionText: string;
        color?: string | null;
      }>;
    };
    highlightsCache = payload.highlights ?? [];
    applyHighlightsToTextLayer();
  }

  function applyHighlightsToTextLayer() {
    // Clear existing highlight rectangles
    highlightLayerEl.innerHTML = "";

    const { currentPage } = getRenderer().getState();
    const pageHighlights = highlightsCache.filter((h) => h.page === currentPage);
    const spans = Array.from(textLayerEl.querySelectorAll("span"));

    if (pageHighlights.length === 0 || spans.length === 0) return;

    // Normalize each span's text, then join with spaces (pdf.js spans don't
    // include inter-word spacing — that's handled by CSS positioning).
    const spanNormTexts = spans.map((s) =>
      (s.textContent ?? "").replace(/\s+/g, " ").trim(),
    );

    // Build full text and track each span's character range within it
    const parts: { spanIndex: number; start: number; end: number }[] = [];
    let fullText = "";
    for (let i = 0; i < spanNormTexts.length; i++) {
      if (spanNormTexts[i].length === 0) continue;
      if (fullText.length > 0) fullText += " ";
      const start = fullText.length;
      fullText += spanNormTexts[i];
      parts.push({ spanIndex: i, start, end: fullText.length });
    }

    // Use highlight layer bounding rect as coordinate reference
    const layerRect = highlightLayerEl.getBoundingClientRect();

    for (const highlight of pageHighlights) {
      const needle = highlight.selectionText.replace(/\s+/g, " ").trim();
      if (!needle) continue;

      const idx = fullText.indexOf(needle);
      if (idx === -1) continue;

      const matchEnd = idx + needle.length;

      // Create positioned rectangles in the highlight overlay for matching spans
      for (const part of parts) {
        if (part.end > idx && part.start < matchEnd) {
          const span = spans[part.spanIndex];
          const rect = span.getBoundingClientRect();
          const div = document.createElement("div");
          div.className = "highlight-rect";
          div.style.left = `${rect.left - layerRect.left}px`;
          div.style.top = `${rect.top - layerRect.top}px`;
          div.style.width = `${rect.width}px`;
          div.style.height = `${rect.height}px`;
          highlightLayerEl.appendChild(div);
        }
      }
    }
  }

  async function saveHighlight(params: { page: number; selectionText: string }) {
    const documentId = getDocumentId();
    if (!documentId) return;

    const result = await app.callServerTool({
      name: "save_highlight",
      arguments: {
        documentId,
        page: params.page,
        selectionText: params.selectionText,
      },
    });
    if (result.isError) return;

    // Optimistic update
    const payload = result.structuredContent as { id?: string } | null;
    const highlightId = payload?.id ?? crypto.randomUUID();
    highlightsCache = [
      { id: highlightId, page: params.page, selectionText: params.selectionText },
      ...highlightsCache,
    ];
    applyHighlightsToTextLayer();
  }

  return { loadHighlights, applyHighlightsToTextLayer, saveHighlight };
}
