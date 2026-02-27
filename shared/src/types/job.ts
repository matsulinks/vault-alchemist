export type JobType =
  | "chat_recompose"
  | "cover_generate"
  | "tag_suggest"
  | "embed"
  | "rollback";

export type JobStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "skipped"
  | "deferred";

export type RiskLevel = "low" | "medium" | "high";

export interface Job {
  job_id: string;
  run_id: string;
  job_type: JobType;
  target: string;
  status: JobStatus;
  started_at: string;
  finished_at?: string;
  hash_snapshot?: string;
  provider_used?: string;
  cost_estimate_usd?: number;
  cost_actual_usd?: number;
  retry_count: number;
  error_code?: string;
  error_message?: string;
}

export type RollbackPolicy = "delete_threads" | "move_to_archive";

export interface ThreadNote {
  path: string;
  title: string;
  hash: string;
}

export interface RollbackLog {
  run_id: string;
  original_note_path: string;
  before_hash: string;
  after_hash: string;
  before_content: string;
  index_note_content: string;
  created_thread_notes: ThreadNote[];
  rollback_policy: RollbackPolicy;
  created_at: string;
}
