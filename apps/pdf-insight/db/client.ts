import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

const DEFAULT_DB_PATH = path.join(process.cwd(), "data", "pdf-insight.db");

export function getDbPath(): string {
  return process.env.PDF_INSIGHT_DB_PATH ?? DEFAULT_DB_PATH;
}

export function ensureDbDir(dbPath: string) {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

export function createDb() {
  const dbPath = getDbPath();
  ensureDbDir(dbPath);
  const sqlite = new Database(dbPath);
  sqlite.pragma("journal_mode = WAL");
  ensureSchema(sqlite);
  return drizzle(sqlite);
}

function ensureSchema(sqlite: Database.Database) {
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      title TEXT,
      source_url TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS documents_source_idx
      ON documents (source_url);

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

    CREATE INDEX IF NOT EXISTS document_settings_doc_idx
      ON document_settings (document_id);
    CREATE INDEX IF NOT EXISTS document_settings_profile_idx
      ON document_settings (profile_id);

    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      page INTEGER NOT NULL,
      selection_text TEXT,
      note_text TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS notes_doc_idx
      ON notes (document_id);

    CREATE TABLE IF NOT EXISTS highlights (
      id TEXT PRIMARY KEY,
      document_id TEXT NOT NULL,
      page INTEGER NOT NULL,
      selection_text TEXT NOT NULL,
      color TEXT,
      created_at INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS highlights_doc_idx
      ON highlights (document_id);
  `);
}

export type DbClient = ReturnType<typeof createDb>;
