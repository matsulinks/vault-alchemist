import type Database from "better-sqlite3";

export interface StoredEmbedding {
  chunkId: string;
  notePath: string;
  text: string;
  vector: number[];
}

export interface EmbeddedNoteInfo {
  notePath: string;
  chunkCount: number;
  updatedAt: string;
}

export class EmbeddingStore {
  constructor(private db: Database.Database) {}

  upsert(
    chunkId: string,
    notePath: string,
    text: string,
    hash: string,
    vector: number[],
    model: string,
  ): void {
    const now = new Date().toISOString();
    this.db
      .prepare(
        `INSERT INTO chunks (chunk_id, note_path, chunk_order, text, hash, created_at, updated_at)
         VALUES (?, ?, 0, ?, ?, ?, ?)
         ON CONFLICT(chunk_id) DO UPDATE SET
           text = excluded.text, hash = excluded.hash, updated_at = excluded.updated_at`,
      )
      .run(chunkId, notePath, text, hash, now, now);

    const buf = Buffer.from(new Float32Array(vector).buffer);
    this.db
      .prepare(
        `INSERT INTO embeddings (chunk_id, vector, model, dim, created_at)
         VALUES (?, ?, ?, ?, ?)
         ON CONFLICT(chunk_id) DO UPDATE SET
           vector = excluded.vector, model = excluded.model, dim = excluded.dim`,
      )
      .run(chunkId, buf, model, vector.length, now);
  }

  getAll(): StoredEmbedding[] {
    const rows = this.db
      .prepare(
        `SELECT e.chunk_id, c.note_path, c.text, e.vector
         FROM embeddings e
         JOIN chunks c ON e.chunk_id = c.chunk_id`,
      )
      .all() as { chunk_id: string; note_path: string; text: string; vector: Buffer }[];

    return rows.map((r) => ({
      chunkId: r.chunk_id,
      notePath: r.note_path,
      text: r.text,
      vector: Array.from(new Float32Array(r.vector.buffer, r.vector.byteOffset, r.vector.byteLength / 4)),
    }));
  }

  listEmbeddedNotes(): EmbeddedNoteInfo[] {
    const rows = this.db
      .prepare(
        `SELECT c.note_path, COUNT(*) as chunkCount, MAX(c.updated_at) as updatedAt
         FROM chunks c
         INNER JOIN embeddings e ON c.chunk_id = e.chunk_id
         GROUP BY c.note_path
         ORDER BY updatedAt DESC`,
      )
      .all() as { note_path: string; chunkCount: number; updatedAt: string }[];

    return rows.map((r) => ({
      notePath: r.note_path,
      chunkCount: r.chunkCount,
      updatedAt: r.updatedAt,
    }));
  }

  hasChunk(hash: string): boolean {
    return this.db.prepare(`SELECT 1 FROM chunks WHERE hash = ?`).get(hash) !== undefined;
  }
}
