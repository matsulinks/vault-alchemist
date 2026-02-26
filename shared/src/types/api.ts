import type { RiskLevel } from "./job.js";

// ヘルスチェック
export interface HealthResponse {
  status: "ok";
  version: string;
  uptime: number;
}

// チャット分割 Estimate
export interface EstimateRequest {
  notePath: string;
  mode?: "fast" | "thorough";
}

export interface EstimateResponse {
  notePath: string;
  estimatedThreadCount: number;
  estimatedDurationSec: number;
  riskBreakdown: {
    low: number;
    medium: number;
    high: number;
  };
  hasPersonalData: boolean;
}

// チャット分割 Run
export type ApplyMode = "dry_run" | "in_place" | "new_files";
export type SplitPrecision = "fast" | "thorough";

export interface RunRequest {
  notePath: string;
  applyMode: ApplyMode;
  precision?: SplitPrecision;
  rollbackPolicy?: "delete_threads" | "move_to_archive";
}

export interface ThreadPreview {
  thread_id: string;
  title: string;
  topic: string;
  summary: string;
  messageCount: number;
  startIndex: number;
  endIndex: number;
  boundaryScore: number;
  riskLevel: RiskLevel;
}

export interface RunResponse {
  run_id: string;
  notePath: string;
  applyMode: ApplyMode;
  threads: ThreadPreview[];
  appliedPaths?: string[];
  indexNotePath?: string;
  costUsd?: number;
  durationMs: number;
}

// ロールバック
export interface RollbackRequest {
  run_id: string;
}

export interface RollbackResponse {
  success: boolean;
  restoredPath: string;
  deletedPaths: string[];
}

// ジョブ履歴
export interface JobHistoryItem {
  run_id: string;
  job_type: string;
  target: string;
  status: string;
  started_at: string;
  finished_at?: string;
  costUsd?: number;
}

export interface JobHistoryResponse {
  items: JobHistoryItem[];
}
