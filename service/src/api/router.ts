import { Router, Request, Response } from "express";
import * as nodePath from "path";
import type {
  HealthResponse,
  EstimateRequest,
  RunRequest,
  RollbackRequest,
} from "@vault-alchemist/shared";
import { estimateNote } from "../pipeline/estimator.js";
import { ApplyEngine } from "../pipeline/apply-engine.js";
import { JobStore } from "../db/job-store.js";
import { getProvider } from "../providers/index.js";

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

  return router;
}
