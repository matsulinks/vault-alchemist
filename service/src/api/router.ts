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
import { getProvider, type OpenAIProviderOptions } from "../providers/index.js";
import { DEFAULT_EMBED_MODEL } from "../providers/openai.js";
import { getDb } from "../db/index.js";
import { EmbeddingStore } from "../db/embedding-store.js";
import { chunkText } from "../pipeline/chunker.js";
import { cosineSimilarity } from "../pipeline/similarity.js";

function withCatch(res: Response, fn: () => unknown): void {
  Promise.resolve(fn()).catch((e: any) => res.status(500).json({ error: e.message }));
}

function requireVault(req: Request, res: Response): string | null {
  const v = req.headers["x-vault-path"] as string;
  if (!v) { res.status(400).json({ error: "x-vault-path header required" }); return null; }
  return v;
}

/** リクエストヘッダーからLLMプロバイダー設定を取り出す（Ollama等のローカルLLM対応） */
function readProviderOptions(req: Request): OpenAIProviderOptions {
  return {
    apiKey: req.headers["x-openai-key"] as string | undefined,
    baseUrl: req.headers["x-llm-base-url"] as string | undefined,
    chatModel: req.headers["x-llm-chat-model"] as string | undefined,
    embedModel: req.headers["x-llm-embed-model"] as string | undefined,
  };
}

/**
 * vaultPathとプロバイダー設定を要求する。x-openai-key は必須ではなく、
 * x-llm-base-url（ローカルLLM等のOpenAI互換API）が指定されていればキー無しでも許可する。
 */
function requireVaultAndProvider(
  req: Request,
  res: Response
): { vaultPath: string; providerOpts: OpenAIProviderOptions } | null {
  const v = req.headers["x-vault-path"] as string;
  if (!v) { res.status(400).json({ error: "x-vault-path header required" }); return null; }
  const providerOpts = readProviderOptions(req);
  if (!providerOpts.apiKey && !providerOpts.baseUrl) {
    res.status(400).json({
      error: "x-openai-key header required (or set x-llm-base-url for a local/OpenAI-compatible endpoint)",
    });
    return null;
  }
  return { vaultPath: v, providerOpts };
}

function makeEngine(vaultPath: string, providerOpts?: OpenAIProviderOptions): ApplyEngine {
  const hasProvider = !!(providerOpts && (providerOpts.apiKey || providerOpts.baseUrl));
  return new ApplyEngine(vaultPath, new JobStore(vaultPath), hasProvider ? getProvider(providerOpts!) : null);
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
    const vaultPath = requireVault(req, res);
    if (!vaultPath || !notePath) {
      if (vaultPath) res.status(400).json({ error: "notePath required" });
      return;
    }
    withCatch(res, () => res.json(estimateNote(nodePath.join(vaultPath, notePath))));
  });

  router.post("/run", (req: Request, res: Response) => {
    const body = req.body as RunRequest;
    const vaultPath = requireVault(req, res);
    if (!vaultPath || !body.notePath) {
      if (vaultPath) res.status(400).json({ error: "notePath required" });
      return;
    }
    const providerOpts = readProviderOptions(req);
    withCatch(res, async () => res.json(await makeEngine(vaultPath, providerOpts).run(body)));
  });

  router.post("/rollback", (req: Request, res: Response) => {
    const body = req.body as RollbackRequest;
    const vaultPath = requireVault(req, res);
    if (!vaultPath || !body.run_id) {
      if (vaultPath) res.status(400).json({ error: "run_id required" });
      return;
    }
    withCatch(res, async () => res.json(await makeEngine(vaultPath).rollback(body)));
  });

  router.get("/jobs", (req: Request, res: Response) => {
    const vaultPath = requireVault(req, res);
    if (!vaultPath) return;
    const runId = req.query["run_id"] as string | undefined;
    res.json({ items: runId ? new JobStore(vaultPath).listByRunId(runId) : [] });
  });

  router.get("/recent-runs", (req: Request, res: Response) => {
    const vaultPath = requireVault(req, res);
    if (!vaultPath) return;
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
    const vaultPath = requireVault(req, res);
    if (!vaultPath) return;
    const body: EmbeddedNotesResponse = {
      items: new EmbeddingStore(getDb(vaultPath)).listEmbeddedNotes(),
    };
    res.json(body);
  });

  router.post("/embed", (req: Request, res: Response) => {
    const { notePath } = req.body as EmbedNoteRequest;
    const headers = requireVaultAndProvider(req, res);
    if (!headers || !notePath) {
      if (headers) res.status(400).json({ error: "notePath required" });
      return;
    }
    const { vaultPath, providerOpts } = headers;
    withCatch(res, async () => {
      const t0 = Date.now();
      const text = fs.readFileSync(nodePath.join(vaultPath, notePath), "utf-8");
      const store = new EmbeddingStore(getDb(vaultPath));
      // 既存の埋め込みと異なるモデルで埋め込もうとしていないか確認する
      store.assertModelConsistency(providerOpts.embedModel || DEFAULT_EMBED_MODEL);
      const provider = getProvider(providerOpts);
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
    const headers = requireVaultAndProvider(req, res);
    if (!headers || !query) {
      if (headers) res.status(400).json({ error: "q param required" });
      return;
    }
    const { vaultPath, providerOpts } = headers;
    withCatch(res, async () => {
      const t0 = Date.now();
      const store = new EmbeddingStore(getDb(vaultPath));
      // 既存の埋め込みと異なるモデルで検索しようとしていないか確認する
      store.assertModelConsistency(providerOpts.embedModel || DEFAULT_EMBED_MODEL);
      const { vector: qVec } = await getProvider(providerOpts).embed(query);
      const results = store.getAll()
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
