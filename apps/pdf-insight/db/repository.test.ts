import { describe, it, expect, beforeEach } from "vitest";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { createRepository } from "./repository.js";

function createTestDb() {
  const sqlite = new Database(":memory:");
  sqlite.pragma("journal_mode = WAL");
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      title TEXT,
      source_url TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS documents_source_idx ON documents (source_url);

    CREATE TABLE IF NOT EXISTS profiles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      settings_json TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS document_settings (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      profile_id TEXT NOT NULL,
      settings_json TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS document_settings_doc_idx ON document_settings (document_id);
    CREATE INDEX IF NOT EXISTS document_settings_profile_idx ON document_settings (profile_id);

    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      page INTEGER NOT NULL,
      selection_text TEXT,
      note_text TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS notes_doc_idx ON notes (document_id);

    CREATE TABLE IF NOT EXISTS highlights (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      page INTEGER NOT NULL,
      selection_text TEXT NOT NULL,
      color TEXT,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS highlights_doc_idx ON highlights (document_id);
  `);
  return drizzle(sqlite);
}

// ---------------------------------------------------------------------------
// upsertDocument
// ---------------------------------------------------------------------------
describe("upsertDocument", () => {
  let repo: ReturnType<typeof createRepository>;

  beforeEach(() => {
    repo = createRepository(createTestDb());
  });

  it("inserts a new document and returns its id", async () => {
    const id = await repo.upsertDocument({ sourceUrl: "https://arxiv.org/pdf/1234" });
    expect(id).toBeTruthy();
    expect(typeof id).toBe("string");
  });

  it("returns the same id for the same sourceUrl (idempotent)", async () => {
    const id1 = await repo.upsertDocument({ sourceUrl: "https://arxiv.org/pdf/1234" });
    const id2 = await repo.upsertDocument({ sourceUrl: "https://arxiv.org/pdf/1234" });
    expect(id1).toBe(id2);
  });

  it("updates title on upsert", async () => {
    const id1 = await repo.upsertDocument({
      sourceUrl: "https://arxiv.org/pdf/1234",
      title: "Original",
    });
    const id2 = await repo.upsertDocument({
      sourceUrl: "https://arxiv.org/pdf/1234",
      title: "Updated",
    });
    expect(id1).toBe(id2);
  });

  it("returns different ids for different sourceUrls", async () => {
    const id1 = await repo.upsertDocument({ sourceUrl: "https://arxiv.org/pdf/1234" });
    const id2 = await repo.upsertDocument({ sourceUrl: "https://arxiv.org/pdf/5678" });
    expect(id1).not.toBe(id2);
  });
});

// ---------------------------------------------------------------------------
// createNote / listNotes
// ---------------------------------------------------------------------------
describe("notes", () => {
  let repo: ReturnType<typeof createRepository>;
  let docId: string;

  beforeEach(async () => {
    repo = createRepository(createTestDb());
    docId = await repo.upsertDocument({ sourceUrl: "https://arxiv.org/pdf/111" });
  });

  it("creates a note and retrieves it", async () => {
    const noteId = await repo.createNote({
      documentId: docId,
      page: 3,
      noteText: "Important finding",
    });
    expect(noteId).toBeTruthy();

    const notes = await repo.listNotes(docId);
    expect(notes).toHaveLength(1);
    expect(notes[0].noteText).toBe("Important finding");
    expect(notes[0].page).toBe(3);
    expect(notes[0].selectionText).toBeNull();
  });

  it("creates a note with selectionText", async () => {
    await repo.createNote({
      documentId: docId,
      page: 1,
      selectionText: "selected text",
      noteText: "My annotation",
    });
    const notes = await repo.listNotes(docId);
    expect(notes[0].selectionText).toBe("selected text");
  });

  it("returns empty array for document with no notes", async () => {
    const notes = await repo.listNotes(docId);
    expect(notes).toEqual([]);
  });

  it("returns notes only for the requested document", async () => {
    const otherDocId = await repo.upsertDocument({ sourceUrl: "https://arxiv.org/pdf/222" });
    await repo.createNote({ documentId: docId, page: 1, noteText: "Note A" });
    await repo.createNote({ documentId: otherDocId, page: 2, noteText: "Note B" });

    const notesForDoc = await repo.listNotes(docId);
    expect(notesForDoc).toHaveLength(1);
    expect(notesForDoc[0].noteText).toBe("Note A");
  });
});

// ---------------------------------------------------------------------------
// createHighlight / listHighlights
// ---------------------------------------------------------------------------
describe("highlights", () => {
  let repo: ReturnType<typeof createRepository>;
  let docId: string;

  beforeEach(async () => {
    repo = createRepository(createTestDb());
    docId = await repo.upsertDocument({ sourceUrl: "https://arxiv.org/pdf/333" });
  });

  it("creates a highlight and retrieves it", async () => {
    const hId = await repo.createHighlight({
      documentId: docId,
      page: 5,
      selectionText: "attention mechanism",
    });
    expect(hId).toBeTruthy();

    const highlights = await repo.listHighlights(docId);
    expect(highlights).toHaveLength(1);
    expect(highlights[0].selectionText).toBe("attention mechanism");
    expect(highlights[0].page).toBe(5);
    expect(highlights[0].color).toBeNull();
  });

  it("stores a custom color", async () => {
    await repo.createHighlight({
      documentId: docId,
      page: 1,
      selectionText: "key phrase",
      color: "#ff0",
    });
    const highlights = await repo.listHighlights(docId);
    expect(highlights[0].color).toBe("#ff0");
  });

  it("returns empty array for document with no highlights", async () => {
    const highlights = await repo.listHighlights(docId);
    expect(highlights).toEqual([]);
  });

  it("returns highlights only for the requested document", async () => {
    const otherDocId = await repo.upsertDocument({ sourceUrl: "https://arxiv.org/pdf/444" });
    await repo.createHighlight({ documentId: docId, page: 1, selectionText: "A" });
    await repo.createHighlight({ documentId: otherDocId, page: 2, selectionText: "B" });

    const hlForDoc = await repo.listHighlights(docId);
    expect(hlForDoc).toHaveLength(1);
    expect(hlForDoc[0].selectionText).toBe("A");
  });
});

// ---------------------------------------------------------------------------
// upsertProfile
// ---------------------------------------------------------------------------
describe("upsertProfile", () => {
  let repo: ReturnType<typeof createRepository>;

  beforeEach(() => {
    repo = createRepository(createTestDb());
  });

  it("inserts a new profile", async () => {
    const id = await repo.upsertProfile({
      name: "default",
      settingsJson: '{"theme":"dark"}',
    });
    expect(id).toBeTruthy();
  });

  it("returns the same id on upsert with same name", async () => {
    const id1 = await repo.upsertProfile({ name: "default", settingsJson: '{"a":1}' });
    const id2 = await repo.upsertProfile({ name: "default", settingsJson: '{"a":2}' });
    expect(id1).toBe(id2);
  });

  it("returns different ids for different names", async () => {
    const id1 = await repo.upsertProfile({ name: "default", settingsJson: "{}" });
    const id2 = await repo.upsertProfile({ name: "custom", settingsJson: "{}" });
    expect(id1).not.toBe(id2);
  });
});

// ---------------------------------------------------------------------------
// upsertDocumentSettings
// ---------------------------------------------------------------------------
describe("upsertDocumentSettings", () => {
  let repo: ReturnType<typeof createRepository>;
  let docId: string;
  let profileId: string;

  beforeEach(async () => {
    repo = createRepository(createTestDb());
    docId = await repo.upsertDocument({ sourceUrl: "https://arxiv.org/pdf/555" });
    profileId = await repo.upsertProfile({ name: "default", settingsJson: "{}" });
  });

  it("inserts new document settings", async () => {
    const id = await repo.upsertDocumentSettings({
      documentId: docId,
      profileId,
      settingsJson: '{"zoom":150}',
    });
    expect(id).toBeTruthy();
  });

  it("returns the same id on upsert for same doc+profile", async () => {
    const id1 = await repo.upsertDocumentSettings({
      documentId: docId,
      profileId,
      settingsJson: '{"zoom":100}',
    });
    const id2 = await repo.upsertDocumentSettings({
      documentId: docId,
      profileId,
      settingsJson: '{"zoom":200}',
    });
    expect(id1).toBe(id2);
  });

  it("returns different ids for different doc+profile combinations", async () => {
    const otherDocId = await repo.upsertDocument({ sourceUrl: "https://arxiv.org/pdf/666" });
    const id1 = await repo.upsertDocumentSettings({
      documentId: docId,
      profileId,
      settingsJson: "{}",
    });
    const id2 = await repo.upsertDocumentSettings({
      documentId: otherDocId,
      profileId,
      settingsJson: "{}",
    });
    expect(id1).not.toBe(id2);
  });
});
