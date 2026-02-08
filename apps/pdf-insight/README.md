# PDF Insight (Document Reader)

Client-agnostic document reader designed to run inside MCP-enabled AI hosts. The app focuses on reading and understanding documents with fast selection-based actions (explain, summarize, translate, annotate), and a persistent memory layer that works across AI clients.

## Current State

- PDF viewer with remote URL loading via allowlist and local file support
- Chunked PDF streaming via an app-only tool
- Text selection menu with actions: **Explain**, **Save Note**
- Notes panel with per-page filtering and optimistic UI updates
- SQLite database (Drizzle ORM) for documents, notes, highlights, profiles, document settings
- Custom inline dialogs (no browser modals — works in sandboxed MCP App iframes)
- Keyboard navigation with proper focus management (shortcuts disabled when typing)
- Test suite (Vitest) covering URL validation helpers and database repository

## Tools

- `list_pdfs`
  - Lists available local files (if configured) and allowed remote origins
- `display_pdf`
  - Opens the PDF viewer UI for a given URL and page
- `read_pdf_bytes`
  - App-only tool used by the UI to stream PDF bytes in chunks
- `save_note`
  - App-only tool to save a note for a document selection
- `list_notes`
  - App-only tool to list saved notes for a document

## Product Vision

Goal: a scalable, client-agnostic document reader that works inside any AI host. Users can open documents, read them in-app, and use AI actions with persistent memory and personalization.

Target users:
- Students and academic readers
- Researchers and analysts
- Business users who read a lot of documents

## MVP → Scale Plan (Implementation Order)

1. **MVP Core** ~~(done)~~
   - PDF URL loading + local file support
   - Selection-based quick actions (Explain, Save Note)
   - Local-only state (SQLite, no auth)
   - App works in any MCP host

2. **Local Notes + Personalization** (in progress)
   - [x] Local DB for notes (SQLite + Drizzle ORM)
   - [x] Save Note action with inline dialog
   - [x] Notes panel with per-page filtering
   - [x] Test suite (Vitest) for server helpers + DB repository
   - [ ] Highlights (DB schema ready, UI not wired)
   - [ ] Per-profile preferences (summary style, language, tone)
   - [ ] Per-document settings overrides

3. **Action System**
   - Configurable action menu (user-defined quick actions)
   - Add built-in actions: Summarize, Translate, Define, Copy
   - Action templates with parameters (tone, length, audience)

4. **Citations + Anchors**
   - Link AI responses to page + text span
   - Highlight source ranges when hovering a response

5. **Collections + Multi-Doc**
   - Collections/workspaces
   - Cross-doc search and navigation

6. **Supabase Migration (Scale)**
   - Auth (Supabase Auth)
   - Persistent DB (Postgres)
   - Document storage (Supabase Storage)
   - Multi-device sync

7. **Memory Layer**
   - Hybrid memory: relational + vector
   - Semantic search across notes and documents
   - Retrieval for better answers and recall

8. **Team/Enterprise**
   - Shared workspaces and annotations
   - Access controls and audit logs
   - Compliance-ready storage policies

## Feature Ideas (Evaluated)

High value:
- Persistent notes/highlights
- Citation-aware answers
- Configurable action menu
- Collections/workspaces
- Hybrid memory (DB + vector)

Medium value:
- Reading modes (focus/skim)
- Audio read-aloud
- Flashcards/spaced repetition

Higher effort / later:
- Knowledge graph across documents
- Collaboration features with permissions

## Storage Strategy

- MVP: local-only persistence (fast, no auth)
- Scale: Supabase for auth, database, and storage
- Design storage as a pluggable layer so the swap is minimal

## Notes

This app mirrors the example in `examples/pdf-server` but is evolving toward a full document reader platform.

## Local Files (MVP)

By default, no local PDFs are allowed. You can enable local PDFs by setting one or both env vars:

- `PDF_LOCAL_FILES`: Comma-separated list of absolute file paths
- `PDF_LOCAL_DIRS`: Comma-separated list of absolute directory paths (all `.pdf` files will be added)

Example:

```bash
PDF_LOCAL_DIRS="/Users/parham/Documents"
PDF_LOCAL_FILES="/Users/parham/Documents/P45.pdf"
```
