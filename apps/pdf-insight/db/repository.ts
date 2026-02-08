import { randomUUID } from "crypto";
import { and, eq } from "drizzle-orm";
import type { DbClient } from "./client.js";
import {
  documents,
  highlights,
  notes,
  profiles,
  documentSettings,
} from "./schema.js";

export function createRepository(db: DbClient) {
  return {
    upsertDocument: async (params: { title?: string; sourceUrl: string }) => {
      const now = new Date();
      const existing = await db
        .select()
        .from(documents)
        .where(eq(documents.sourceUrl, params.sourceUrl))
        .get();

      if (existing) {
        await db
          .update(documents)
          .set({
            title: params.title ?? existing.title,
            updatedAt: now,
          })
          .where(eq(documents.id, existing.id));
        return existing.id;
      }

      const id = randomUUID();
      await db.insert(documents).values({
        id,
        title: params.title ?? null,
        sourceUrl: params.sourceUrl,
        createdAt: now,
        updatedAt: now,
      });
      return id;
    },

    createNote: async (params: {
      documentId: string;
      page: number;
      selectionText?: string;
      noteText: string;
    }) => {
      const id = randomUUID();
      await db.insert(notes).values({
        id,
        documentId: params.documentId,
        page: params.page,
        selectionText: params.selectionText ?? null,
        noteText: params.noteText,
        createdAt: new Date(),
      });
      return id;
    },

    listNotes: async (documentId: string) => {
      return db.select().from(notes).where(eq(notes.documentId, documentId)).all();
    },

    createHighlight: async (params: {
      documentId: string;
      page: number;
      selectionText: string;
      color?: string;
    }) => {
      const id = randomUUID();
      await db.insert(highlights).values({
        id,
        documentId: params.documentId,
        page: params.page,
        selectionText: params.selectionText,
        color: params.color ?? null,
        createdAt: new Date(),
      });
      return id;
    },

    listHighlights: async (documentId: string) => {
      return db
        .select()
        .from(highlights)
        .where(eq(highlights.documentId, documentId))
        .all();
    },

    upsertProfile: async (params: { name: string; settingsJson: string }) => {
      const now = new Date();
      const existing = await db
        .select()
        .from(profiles)
        .where(eq(profiles.name, params.name))
        .get();

      if (existing) {
        await db
          .update(profiles)
          .set({ settingsJson: params.settingsJson, updatedAt: now })
          .where(eq(profiles.id, existing.id));
        return existing.id;
      }

      const id = randomUUID();
      await db.insert(profiles).values({
        id,
        name: params.name,
        settingsJson: params.settingsJson,
        createdAt: now,
        updatedAt: now,
      });
      return id;
    },

    upsertDocumentSettings: async (params: {
      documentId: string;
      profileId: string;
      settingsJson: string;
    }) => {
      const now = new Date();
      const existing = await db
        .select()
        .from(documentSettings)
        .where(
          and(
            eq(documentSettings.documentId, params.documentId),
            eq(documentSettings.profileId, params.profileId),
          ),
        )
        .get();

      if (existing) {
        await db
          .update(documentSettings)
          .set({ settingsJson: params.settingsJson, updatedAt: now })
          .where(eq(documentSettings.id, existing.id));
        return existing.id;
      }

      const id = randomUUID();
      await db.insert(documentSettings).values({
        id,
        documentId: params.documentId,
        profileId: params.profileId,
        settingsJson: params.settingsJson,
        createdAt: now,
        updatedAt: now,
      });
      return id;
    },
  };
}
