import { describe, it, expect, beforeEach } from "vitest";
import Database from "better-sqlite3";
import { EmbeddingStore } from "./embedding-store.js";

function makeDb(): Database.Database {
  const db = new Database(":memory:");
  db.pragma("journal_mode = WAL");
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
    CREATE TABLE IF NOT EXISTS embeddings (
      chunk_id    TEXT PRIMARY KEY,
      vector      BLOB NOT NULL,
      model       TEXT NOT NULL,
      dim         INTEGER NOT NULL,
      created_at  TEXT NOT NULL
    );
  `);
  return db;
}

describe("EmbeddingStore", () => {
  let store: EmbeddingStore;

  beforeEach(() => {
    store = new EmbeddingStore(makeDb());
  });

  it("ベクトルを保存して全件取得できる", () => {
    const vec = [0.1, 0.2, 0.3];
    store.upsert("chunk-1", "notes/a.md", "テストテキスト", "hash-abc", vec, "text-embedding-3-small");

    const all = store.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].chunkId).toBe("chunk-1");
    expect(all[0].notePath).toBe("notes/a.md");
    expect(all[0].text).toBe("テストテキスト");
    expect(all[0].vector).toHaveLength(3);
    expect(all[0].vector[0]).toBeCloseTo(0.1);
    expect(all[0].vector[1]).toBeCloseTo(0.2);
    expect(all[0].vector[2]).toBeCloseTo(0.3);
  });

  it("同じ chunk_id で upsert すると上書きされる", () => {
    store.upsert("chunk-1", "notes/a.md", "初回テキスト", "hash-1", [0.1, 0.2], "model-a");
    store.upsert("chunk-1", "notes/a.md", "更新テキスト", "hash-2", [0.9, 0.8], "model-a");

    const all = store.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].text).toBe("更新テキスト");
    expect(all[0].vector[0]).toBeCloseTo(0.9);
  });

  it("複数チャンクを保存して全件取得できる", () => {
    store.upsert("c1", "notes/a.md", "チャンク1", "h1", [1, 0, 0], "m");
    store.upsert("c2", "notes/b.md", "チャンク2", "h2", [0, 1, 0], "m");
    store.upsert("c3", "notes/a.md", "チャンク3", "h3", [0, 0, 1], "m");

    const all = store.getAll();
    expect(all).toHaveLength(3);
  });

  it("hasChunk: 既存ハッシュは true、未存在は false", () => {
    store.upsert("c1", "notes/a.md", "テキスト", "known-hash", [1, 2], "m");

    expect(store.hasChunk("known-hash")).toBe(true);
    expect(store.hasChunk("unknown-hash")).toBe(false);
  });

  it("空の DB では getAll が空配列を返す", () => {
    expect(store.getAll()).toHaveLength(0);
  });
});
