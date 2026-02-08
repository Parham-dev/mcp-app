import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

export const documents = sqliteTable(
  "documents",
  {
    id: text("id").primaryKey(),
    title: text("title"),
    sourceUrl: text("source_url").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => ({
    sourceIdx: index("documents_source_idx").on(table.sourceUrl),
  }),
);

export const profiles = sqliteTable("profiles", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  settingsJson: text("settings_json").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const documentSettings = sqliteTable(
  "document_settings",
  {
    id: text("id").primaryKey(),
    documentId: text("document_id").notNull(),
    profileId: text("profile_id").notNull(),
    settingsJson: text("settings_json").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => ({
    docIdx: index("document_settings_doc_idx").on(table.documentId),
    profileIdx: index("document_settings_profile_idx").on(table.profileId),
  }),
);

export const notes = sqliteTable(
  "notes",
  {
    id: text("id").primaryKey(),
    documentId: text("document_id").notNull(),
    page: integer("page").notNull(),
    selectionText: text("selection_text"),
    noteText: text("note_text").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => ({
    docIdx: index("notes_doc_idx").on(table.documentId),
  }),
);

export const highlights = sqliteTable(
  "highlights",
  {
    id: text("id").primaryKey(),
    documentId: text("document_id").notNull(),
    page: integer("page").notNull(),
    selectionText: text("selection_text").notNull(),
    color: text("color"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => ({
    docIdx: index("highlights_doc_idx").on(table.documentId),
  }),
);
