import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import type { Job, JobStatus, JobType, RollbackLog } from "@vault-alchemist/shared";

export class JobStore {
  private jobsDir: string;
  private rollbackDir: string;

  constructor(vaultPath: string) {
    this.jobsDir = path.join(vaultPath, "_alchemy", "logs", "jobs");
    this.rollbackDir = path.join(vaultPath, "_alchemy", "logs", "rollback");
    fs.mkdirSync(this.jobsDir, { recursive: true });
    fs.mkdirSync(this.rollbackDir, { recursive: true });
  }

  createJob(params: {
    run_id: string;
    job_type: JobType;
    target: string;
    hash_snapshot?: string;
  }): Job {
    const job: Job = {
      job_id: crypto.randomUUID(),
      run_id: params.run_id,
      job_type: params.job_type,
      target: params.target,
      status: "pending",
      started_at: new Date().toISOString(),
      hash_snapshot: params.hash_snapshot,
      retry_count: 0,
    };
    this.saveJob(job);
    return job;
  }

  updateJob(job_id: string, updates: Partial<Job>): Job {
    const job = this.getJob(job_id);
    if (!job) throw new Error(`Job not found: ${job_id}`);
    const updated = { ...job, ...updates };
    this.saveJob(updated);
    return updated;
  }

  getJob(job_id: string): Job | null {
    const p = path.join(this.jobsDir, `${job_id}.json`);
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, "utf-8")) as Job;
  }

  /** 同じ hash_snapshot の完了済みジョブがあればスキップ判定 */
  isAlreadyDone(hash_snapshot: string, job_type: JobType): boolean {
    if (!fs.existsSync(this.jobsDir)) return false;
    const files = fs.readdirSync(this.jobsDir);
    for (const f of files) {
      try {
        const job = JSON.parse(
          fs.readFileSync(path.join(this.jobsDir, f), "utf-8")
        ) as Job;
        if (
          job.hash_snapshot === hash_snapshot &&
          job.job_type === job_type &&
          job.status === "completed"
        ) {
          return true;
        }
      } catch {
        // 壊れたファイルは無視
      }
    }
    return false;
  }

  listByRunId(run_id: string): Job[] {
    if (!fs.existsSync(this.jobsDir)) return [];
    return fs
      .readdirSync(this.jobsDir)
      .map((f) => {
        try {
          return JSON.parse(
            fs.readFileSync(path.join(this.jobsDir, f), "utf-8")
          ) as Job;
        } catch {
          return null;
        }
      })
      .filter((j): j is Job => j !== null && j.run_id === run_id);
  }

  saveRollbackLog(log: RollbackLog): void {
    const p = path.join(this.rollbackDir, `${log.run_id}.json`);
    fs.writeFileSync(p, JSON.stringify(log, null, 2), "utf-8");
  }

  getRollbackLog(run_id: string): RollbackLog | null {
    const p = path.join(this.rollbackDir, `${run_id}.json`);
    if (!fs.existsSync(p)) return null;
    return JSON.parse(fs.readFileSync(p, "utf-8")) as RollbackLog;
  }

  private saveJob(job: Job): void {
    fs.writeFileSync(
      path.join(this.jobsDir, `${job.job_id}.json`),
      JSON.stringify(job, null, 2),
      "utf-8"
    );
  }
}
