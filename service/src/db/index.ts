import { DatabaseSync } from "node:sqlite";
import * as fs from "fs";
import * as path from "path";

let _db: DatabaseSync | null = null;

export function getDb(vaultPath: string): DatabaseSync {
  if (_db) return _db;

  const dbDir = path.join(vaultPath, "_alchemy", "index");
  fs.mkdirSync(dbDir, { recursive: true });

  _db = new DatabaseSync(path.join(dbDir, "semantic.sqlite"));
  _db.exec("PRAGMA journal_mode = WAL;");
  _db.exec("PRAGMA foreign_keys = ON;");

  applyMigrations(_db);
  return _db;
}

function applyMigrations(db: DatabaseSync): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS chunks (
      chunk_id     TEXT PRIMARY KEY,
      note_path    TEXT NOT NULL,
      project_id   TEXT,
      chunk_order  INTEGER NOT NULL,
      text         TEXT NOT NULL,
      token_count  INTEGER,
      hash         TEXT NOT NULL,
      created_at   TEXT NOT NULL,
      updated_at   TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS note_meta_cache (
      note_path       TEXT PRIMARY KEY,
      title           TEXT,
      topic           TEXT,
      tags_big        TEXT,
      tags_mid        TEXT,
      tags_small      TEXT,
      tags_micro      TEXT,
      source_date     TEXT,
      freshness       TEXT,
      confidence      TEXT,
      status          TEXT,
      personal_data   TEXT,
      updated_at      TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS embeddings (
      chunk_id    TEXT PRIMARY KEY,
      vector      BLOB NOT NULL,
      model       TEXT NOT NULL,
      dim         INTEGER NOT NULL,
      created_at  TEXT NOT NULL
    );
  `);
}
