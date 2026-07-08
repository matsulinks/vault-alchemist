import type { DatabaseSync } from "node:sqlite";

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
  constructor(private db: DatabaseSync) {}

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
      .all() as { chunk_id: string; note_path: string; text: string; vector: Uint8Array }[];

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

  /** 既存の埋め込みで使われているモデル名の一覧（重複なし） */
  listUsedModels(): string[] {
    const rows = this.db.prepare(`SELECT DISTINCT model FROM embeddings`).all() as { model: string }[];
    return rows.map((r) => r.model);
  }

  /**
   * 現在設定されている埋め込みモデルと、既存の埋め込みのモデルが一致するか検証する。
   * 異なるモデルのベクトルは同じ空間で比較できず、類似度検索が意味を成さなくなるため、
   * 不一致が見つかった場合は明確なエラーを投げる（自動再埋め込みは行わない）。
   */
  assertModelConsistency(currentModel: string): void {
    const mismatched = this.listUsedModels().filter((m) => m !== currentModel);
    if (mismatched.length > 0) {
      throw new Error(
        `埋め込みモデルの不一致を検出しました。既存の埋め込みは [${mismatched.join(", ")}] で作成されていますが、` +
        `現在の設定では "${currentModel}" を使用しようとしています。異なるモデルのベクトルは比較できません。` +
        `設定モデルを既存のものに戻すか、既存の埋め込みを削除してから "${currentModel}" で再埋め込みしてください。`
      );
    }
  }
}
