import { Router, Request, Response } from "express";
import * as nodePath from "path";
import * as fs from "fs";
import type {
  HealthResponse,
  EstimateRequest,
  RunRequest,
  RollbackRequest,
  EmbedNoteRequest,
  EmbedNoteResponse,
  SearchResponse,
  RecentRunsResponse,
  EmbeddedNotesResponse,
} from "@vault-alchemist/shared";
import { estimateNote } from "../pipeline/estimator.js";
import { ApplyEngine } from "../pipeline/apply-engine.js";
import { JobStore } from "../db/job-store.js";
import { getProvider } from "../providers/index.js";
import { getDb } from "../db/index.js";
import { EmbeddingStore } from "../db/embedding-store.js";
import { chunkText } from "../pipeline/chunker.js";
import { cosineSimilarity } from "../pipeline/similarity.js";

function withCatch(res: Response, fn: () => unknown): void {
  Promise.resolve(fn()).catch((e: any) => res.status(500).json({ error: e.message }));
}

function makeEngine(vaultPath: string, apiKey?: string): ApplyEngine {
  return new ApplyEngine(vaultPath, new JobStore(vaultPath), apiKey ? getProvider(apiKey) : null);
}

export function createApiRouter(startedAt: number): Router {
  const router = Router();

  router.get("/health", (_req: Request, res: Response) => {
    const body: HealthResponse = {
      status: "ok",
      version: "0.1.0",
      uptime: Math.floor((Date.now() - startedAt) / 1000),
    };
    res.json(body);
  });

  router.post("/estimate", (req: Request, res: Response) => {
    const { notePath } = req.body as EstimateRequest;
    const vaultPath = req.headers["x-vault-path"] as string;
    if (!notePath || !vaultPath) {
      res.status(400).json({ error: "notePath and x-vault-path header required" });
      return;
    }
    withCatch(res, () => res.json(estimateNote(nodePath.join(vaultPath, notePath))));
  });

  router.post("/run", (req: Request, res: Response) => {
    const body = req.body as RunRequest;
    const vaultPath = req.headers["x-vault-path"] as string;
    const apiKey = req.headers["x-openai-key"] as string | undefined;
    if (!body.notePath || !vaultPath) {
      res.status(400).json({ error: "notePath and x-vault-path header required" });
      return;
    }
    withCatch(res, async () => res.json(await makeEngine(vaultPath, apiKey).run(body)));
  });

  router.post("/rollback", (req: Request, res: Response) => {
    const body = req.body as RollbackRequest;
    const vaultPath = req.headers["x-vault-path"] as string;
    if (!body.run_id || !vaultPath) {
      res.status(400).json({ error: "run_id and x-vault-path header required" });
      return;
    }
    withCatch(res, async () => res.json(await makeEngine(vaultPath).rollback(body)));
  });

  router.get("/jobs", (req: Request, res: Response) => {
    const vaultPath = req.headers["x-vault-path"] as string;
    if (!vaultPath) {
      res.status(400).json({ error: "x-vault-path header required" });
      return;
    }
    const runId = req.query["run_id"] as string | undefined;
    res.json({ items: runId ? new JobStore(vaultPath).listByRunId(runId) : [] });
  });

  router.get("/recent-runs", (req: Request, res: Response) => {
    const vaultPath = req.headers["x-vault-path"] as string;
    if (!vaultPath) {
      res.status(400).json({ error: "x-vault-path header required" });
      return;
    }
    const sinceHours = parseInt(req.query["since_hours"] as string) || 24;
    const logs = new JobStore(vaultPath).listRecentRollbacks(sinceHours);
    const body: RecentRunsResponse = {
      items: logs.map((log) => ({
        run_id: log.run_id,
        notePath: log.original_note_path,
        threadCount: log.created_thread_notes.length,
        threadTitles: log.created_thread_notes.map((t) => t.title),
        createdAt: log.created_at,
      })),
    };
    res.json(body);
  });

  router.get("/embedded-notes", (req: Request, res: Response) => {
    const vaultPath = req.headers["x-vault-path"] as string;
    if (!vaultPath) {
      res.status(400).json({ error: "x-vault-path header required" });
      return;
    }
    const body: EmbeddedNotesResponse = {
      items: new EmbeddingStore(getDb(vaultPath)).listEmbeddedNotes(),
    };
    res.json(body);
  });

  router.post("/embed", (req: Request, res: Response) => {
    const { notePath } = req.body as EmbedNoteRequest;
    const vaultPath = req.headers["x-vault-path"] as string;
    const apiKey = req.headers["x-openai-key"] as string | undefined;
    if (!notePath || !vaultPath || !apiKey) {
      res.status(400).json({ error: "notePath, x-vault-path and x-openai-key required" });
      return;
    }
    withCatch(res, async () => {
      const t0 = Date.now();
      const text = fs.readFileSync(nodePath.join(vaultPath, notePath), "utf-8");
      const store = new EmbeddingStore(getDb(vaultPath));
      const provider = getProvider(apiKey);
      let costUsd = 0, embedded = 0, skipped = 0;
      for (const chunk of chunkText(notePath, text)) {
        if (store.hasChunk(chunk.hash)) { skipped++; continue; }
        const result = await provider.embed(chunk.text);
        store.upsert(chunk.chunkId, notePath, chunk.text, chunk.hash, result.vector, result.model);
        costUsd += result.costUsd;
        embedded++;
      }
      const body: EmbedNoteResponse = { notePath, chunksEmbedded: embedded, chunksSkipped: skipped, costUsd, durationMs: Date.now() - t0 };
      res.json(body);
    });
  });

  router.get("/search", (req: Request, res: Response) => {
    const query = req.query["q"] as string | undefined;
    const topK = Math.min(parseInt(req.query["top_k"] as string) || 5, 20);
    const vaultPath = req.headers["x-vault-path"] as string;
    const apiKey = req.headers["x-openai-key"] as string | undefined;
    if (!query || !vaultPath || !apiKey) {
      res.status(400).json({ error: "q param, x-vault-path and x-openai-key required" });
      return;
    }
    withCatch(res, async () => {
      const t0 = Date.now();
      const { vector: qVec } = await getProvider(apiKey).embed(query);
      const results = new EmbeddingStore(getDb(vaultPath)).getAll()
        .map((e) => ({ ...e, score: cosineSimilarity(qVec, e.vector) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, topK)
        .map(({ chunkId, notePath, text, score }) => ({ chunkId, notePath, text, score }));
      const body: SearchResponse = { results, durationMs: Date.now() - t0 };
      res.json(body);
    });
  });

  return router;
}
