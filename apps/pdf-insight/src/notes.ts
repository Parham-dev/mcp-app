import type { App } from "@modelcontextprotocol/ext-apps";
import type { PdfRenderer } from "./pdf-renderer";
import { renderNotesList, setNotesStatus } from "./ui";

export type NotesManager = ReturnType<typeof createNotesManager>;

export function createNotesManager(deps: {
  app: App;
  getDocumentId: () => string | undefined;
  getRenderer: () => PdfRenderer;
}) {
  const { app, getDocumentId, getRenderer } = deps;

  let notesCache: Array<{
    id: string;
    page: number;
    noteText: string;
    selectionText?: string | null;
  }> = [];

  async function loadNotes() {
    const documentId = getDocumentId();
    if (!documentId) {
      notesCache = [];
      renderNotesForPage();
      return;
    }
    const result = await app.callServerTool({
      name: "list_notes",
      arguments: { documentId },
    });
    if (result.isError || !result.structuredContent) {
      notesCache = [];
      renderNotesForPage();
      setNotesStatus("Failed to load notes", "error");
      return;
    }
    const payload = result.structuredContent as unknown as {
      notes: Array<{
        id: string;
        page: number;
        noteText: string;
        selectionText?: string | null;
      }>;
    };
    notesCache = payload.notes ?? [];
    renderNotesForPage();
  }

  function renderNotesForPage() {
    const { currentPage } = getRenderer().getState();
    const notesForPage = notesCache.filter((note) => note.page === currentPage);
    renderNotesList(notesForPage, {
      currentPage,
      totalNotes: notesCache.length,
    });
  }

  async function saveNote(params: {
    page: number;
    selectionText: string;
    noteText: string;
  }) {
    const documentId = getDocumentId();
    if (!documentId) return;

    setNotesStatus("Saving...", "info");
    const result = await app.callServerTool({
      name: "save_note",
      arguments: {
        documentId,
        page: params.page,
        selectionText: params.selectionText,
        noteText: params.noteText,
      },
    });
    if (result.isError) {
      const errorText = result.content
        ?.map((c) => ("text" in c ? c.text : ""))
        .join(" ")
        .trim();
      setNotesStatus(errorText ? `Save failed: ${errorText}` : "Save failed", "error");
      return;
    }

    // Optimistic update — add note to local cache immediately
    const payload = result.structuredContent as { id?: string } | null;
    const noteId = payload?.id ?? crypto.randomUUID();
    notesCache = [
      { id: noteId, page: params.page, noteText: params.noteText, selectionText: params.selectionText },
      ...notesCache,
    ];
    renderNotesForPage();

    setNotesStatus("Saved", "success");
    setTimeout(() => setNotesStatus("", "none"), 2000);
  }

  return { loadNotes, renderNotesForPage, saveNote };
}
