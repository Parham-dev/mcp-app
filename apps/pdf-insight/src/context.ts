import type { App } from "@modelcontextprotocol/ext-apps";
import type { PdfRenderer } from "./pdf-renderer";
import type { SelectionMenu } from "./selection-menu";

const MAX_MODEL_CONTEXT_LENGTH = 15000;

function formatPageContent(
  text: string,
  maxLength: number,
  selection?: { start: number; end: number },
): string {
  const T = "<truncated-content/>";
  if (text.length <= maxLength) {
    if (!selection) return text;
    return (
      text.slice(0, selection.start) +
      `<pdf-selection>${text.slice(selection.start, selection.end)}</pdf-selection>` +
      text.slice(selection.end)
    );
  }
  if (!selection) {
    return text.slice(0, maxLength) + "\n" + T;
  }

  const selLen = selection.end - selection.start;
  const overhead = "<pdf-selection></pdf-selection>".length + T.length * 2 + 4;
  const contextBudget = maxLength - overhead;

  if (selLen > contextBudget) {
    const keepLen = Math.max(100, contextBudget);
    const halfKeep = Math.floor(keepLen / 2);
    const selStart = text.slice(selection.start, selection.start + halfKeep);
    const selEnd = text.slice(selection.end - halfKeep, selection.end);
    return (
      `<pdf-selection>${selStart}` +
      `\n${T}\n` +
      `${selEnd}</pdf-selection>`
    );
  }

  const remainingBudget = contextBudget - selLen;
  const beforeBudget = Math.floor(remainingBudget / 2);
  const afterBudget = remainingBudget - beforeBudget;
  const windowStart = Math.max(0, selection.start - beforeBudget);
  const windowEnd = Math.min(text.length, selection.end + afterBudget);
  const adjStart = selection.start - windowStart;
  const adjEnd = selection.end - windowStart;
  const windowText = text.slice(windowStart, windowEnd);

  return (
    (windowStart > 0 ? T + "\n" : "") +
    windowText.slice(0, adjStart) +
    `<pdf-selection>${windowText.slice(adjStart, adjEnd)}</pdf-selection>` +
    windowText.slice(adjEnd) +
    (windowEnd < text.length ? "\n" + T : "")
  );
}

function findSelectionInText(
  pageText: string,
  selectedText: string,
): { start: number; end: number } | undefined {
  if (!selectedText || selectedText.length <= 2) return undefined;
  let start = pageText.indexOf(selectedText);
  if (start >= 0) {
    return { start, end: start + selectedText.length };
  }
  const noSpaceSel = selectedText.replace(/\s+/g, "");
  const noSpaceText = pageText.replace(/\s+/g, "");
  const noSpaceStart = noSpaceText.indexOf(noSpaceSel);
  if (noSpaceStart >= 0) {
    start = Math.floor((noSpaceStart / noSpaceText.length) * pageText.length);
    return { start, end: start + selectedText.length };
  }
  return undefined;
}

export function createContextUpdater(params: {
  app: App;
  renderer: PdfRenderer;
  selectionMenu: SelectionMenu;
  getPdfMeta: () => { pdfUrl: string; pdfTitle?: string };
}) {
  const { app, renderer, selectionMenu, getPdfMeta } = params;

  return async function updatePageContext() {
    const { currentPage, totalPages } = renderer.getState();
    if (!currentPage || !totalPages) return;

    try {
      const pageText = await renderer.getPageText(currentPage);
      const selectedText = selectionMenu.getSelectionText();
      const selection = selectedText
        ? findSelectionInText(pageText, selectedText)
        : undefined;

      const content = formatPageContent(
        pageText,
        MAX_MODEL_CONTEXT_LENGTH,
        selection,
      );

      const toolId = app.getHostContext()?.toolInfo?.id;
      const meta = getPdfMeta();
      const header = [
        `PDF viewer${toolId ? ` (${toolId})` : ""}`,
        meta.pdfTitle ? `"${meta.pdfTitle}"` : meta.pdfUrl,
        `Current Page: ${currentPage}/${totalPages}`,
      ].join(" | ");

      app.updateModelContext({
        content: [{ type: "text", text: `${header}\n\nPage content:\n${content}` }],
      });
    } catch {
      // best-effort
    }
  };
}
