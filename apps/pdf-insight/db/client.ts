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
  return drizzle(sqlite);
}

export type DbClient = ReturnType<typeof createDb>;
