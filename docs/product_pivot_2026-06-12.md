# Vault Alchemist Product Pivot 2026-06-12

## Why this pivot exists

Vault Alchemist was first designed as an Obsidian plugin.

That was a reasonable starting point, but it created one practical problem:

> If the maintainer does not use Obsidian every day, an Obsidian-first product will not become a daily product.

The goal is no longer "make Obsidian smarter first."

The goal is:

> Make a local app that turns scattered AI conversations, notes, and documents into reusable knowledge assets.

Obsidian remains supported, but it becomes one source and export target, not the center of the product.

## New Product Definition

Vault Alchemist is a local knowledge refinery app.

It watches selected folders, imports chat logs and documents, proposes safe organization, creates summaries and covers, and keeps rollback logs so the user can trust it.

It is not trying to replace ChatGPT, Claude, Codex, NotebookLM, or Obsidian.

It prepares the material those tools need.

## What Changes

| Before | After |
|---|---|
| Obsidian plugin first | Standalone local app first |
| Obsidian vault is the main data home | Any local folder can be a workspace |
| Plugin UI is the primary interface | Browser app first, desktop wrapper later |
| Obsidian install is required | Obsidian is optional |
| Chat Cleaner inside Obsidian | Inbox Review app for AI chats and documents |
| Semantic search as a large feature | First focus on safe import, summary, cover, and review |

## What Stays

- Local-first by default
- Human approval before destructive changes
- Rollback logs
- Raw conversations can be intentionally published when the user chooses
- Persona Public Mode remains the long-term differentiator
- Obsidian export/import remains important

## App-First MVP

The first useful version should open in a browser at `http://127.0.0.1:3000/`.

It should do only a few things well:

1. Choose a local workspace folder
2. Show an inbox of chat logs and documents
3. Preview AI-generated covers
4. Propose splits, tags, and archive candidates
5. Apply only after user approval
6. Undo the latest run

## Product Position

AI tools already have file search, project memory, connectors, and external tools.

Vault Alchemist should not compete with those head-on.

It should be the local prep kitchen:

```text
messy files / chats / notes
  -> Vault Alchemist
  -> clean summaries, topics, covers, indexes, exports
  -> ChatGPT / Claude / Codex / NotebookLM / Obsidian
```

## Near-Term Architecture

```text
vault-alchemist/
├── app/       browser UI, served by the local service
├── service/   local API, scanner, parser, job log, rollback
├── shared/    common types
├── plugin/    optional Obsidian adapter
└── docs/
```

## Next Implementation Path

1. Add a tiny browser UI served by the local service
2. Make `/health` visible in the UI
3. Add workspace selection
4. Add folder scan
5. Add inbox list
6. Add preview-only cover generation
7. Add apply + rollback later

This makes the product usable even before the Obsidian plugin is complete.
