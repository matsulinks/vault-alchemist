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
} from "@vault-alchemist/shared";
import { estimateNote } from "../pipeline/estimator.js";
import { ApplyEngine } from "../pipeline/apply-engine.js";
import { JobStore } from "../db/job-store.js";
import { getProvider } from "../providers/index.js";
import { getDb } from "../db/index.js";
import { EmbeddingStore } from "../db/embedding-store.js";
import { chunkText } from "../pipeline/chunker.js";
import { cosineSimilarity } from "../pipeline/similarity.js";

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
    try {
      const result = estimateNote(nodePath.join(vaultPath, notePath));
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.post("/run", async (req: Request, res: Response) => {
    const body = req.body as RunRequest;
    const vaultPath = req.headers["x-vault-path"] as string;
    const apiKey = req.headers["x-openai-key"] as string | undefined;

    if (!body.notePath || !vaultPath) {
      res.status(400).json({ error: "notePath and x-vault-path header required" });
      return;
    }

    try {
      const result = await makeEngine(vaultPath, apiKey).run(body);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.post("/rollback", async (req: Request, res: Response) => {
    const body = req.body as RollbackRequest;
    const vaultPath = req.headers["x-vault-path"] as string;

    if (!body.run_id || !vaultPath) {
      res.status(400).json({ error: "run_id and x-vault-path header required" });
      return;
    }

    try {
      const result = await makeEngine(vaultPath).rollback(body);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.get("/jobs", (req: Request, res: Response) => {
    const vaultPath = req.headers["x-vault-path"] as string;
    if (!vaultPath) {
      res.status(400).json({ error: "x-vault-path header required" });
      return;
    }
    const runId = req.query["run_id"] as string | undefined;
    const jobs = runId ? new JobStore(vaultPath).listByRunId(runId) : [];
    res.json({ items: jobs });
  });

  router.post("/embed", async (req: Request, res: Response) => {
    const { notePath } = req.body as EmbedNoteRequest;
    const vaultPath = req.headers["x-vault-path"] as string;
    const apiKey = req.headers["x-openai-key"] as string | undefined;

    if (!notePath || !vaultPath || !apiKey) {
      res.status(400).json({ error: "notePath, x-vault-path and x-openai-key required" });
      return;
    }

    try {
      const t0 = Date.now();
      const fullPath = nodePath.join(vaultPath, notePath);
      const text = fs.readFileSync(fullPath, "utf-8");
      const chunks = chunkText(notePath, text);
      const store = new EmbeddingStore(getDb(vaultPath));
      const provider = getProvider(apiKey);

      let costUsd = 0;
      let embedded = 0;
      let skipped = 0;

      for (const chunk of chunks) {
        if (store.hasChunk(chunk.hash)) {
          skipped++;
          continue;
        }
        const result = await provider.embed(chunk.text);
        store.upsert(chunk.chunkId, notePath, chunk.text, chunk.hash, result.vector, result.model);
        costUsd += result.costUsd;
        embedded++;
      }

      const body: EmbedNoteResponse = {
        notePath,
        chunksEmbedded: embedded,
        chunksSkipped: skipped,
        costUsd,
        durationMs: Date.now() - t0,
      };
      res.json(body);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  router.get("/search", async (req: Request, res: Response) => {
    const query = req.query["q"] as string | undefined;
    const topK = Math.min(parseInt(req.query["top_k"] as string) || 5, 20);
    const vaultPath = req.headers["x-vault-path"] as string;
    const apiKey = req.headers["x-openai-key"] as string | undefined;

    if (!query || !vaultPath || !apiKey) {
      res.status(400).json({ error: "q param, x-vault-path and x-openai-key required" });
      return;
    }

    try {
      const t0 = Date.now();
      const provider = getProvider(apiKey);
      const { vector: qVec } = await provider.embed(query);
      const all = new EmbeddingStore(getDb(vaultPath)).getAll();

      const results = all
        .map((e) => ({ ...e, score: cosineSimilarity(qVec, e.vector) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, topK)
        .map(({ chunkId, notePath, text, score }) => ({ chunkId, notePath, text, score }));

      const body: SearchResponse = { results, durationMs: Date.now() - t0 };
      res.json(body);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  return router;
}
