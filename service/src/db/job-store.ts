import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import type { Job, JobType, RollbackLog } from "@vault-alchemist/shared";

export class JobStore {
  private jobsDir: string;
  private rollbackDir: string;

  constructor(vaultPath: string) {
    this.jobsDir = path.join(vaultPath, "_alchemy", "logs", "jobs");
    this.rollbackDir = path.join(vaultPath, "_alchemy", "logs", "rollback");
    fs.mkdirSync(this.jobsDir, { recursive: true });
    fs.mkdirSync(this.rollbackDir, { recursive: true });
  }

  createJob(params: { run_id: string; job_type: JobType; target: string; hash_snapshot?: string }): Job {
    const job: Job = {
      job_id: crypto.randomUUID(), ...params,
      status: "pending", started_at: new Date().toISOString(), retry_count: 0,
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
    return this.readJson<Job>(path.join(this.jobsDir, `${job_id}.json`));
  }

  isAlreadyDone(hash_snapshot: string, job_type: JobType): boolean {
    return this.readAllJobs().some(
      (j) => j.hash_snapshot === hash_snapshot && j.job_type === job_type && j.status === "completed"
    );
  }

  listByRunId(run_id: string): Job[] {
    return this.readAllJobs().filter((j) => j.run_id === run_id);
  }

  saveRollbackLog(log: RollbackLog): void {
    fs.writeFileSync(path.join(this.rollbackDir, `${log.run_id}.json`), JSON.stringify(log, null, 2));
  }

  getRollbackLog(run_id: string): RollbackLog | null {
    return this.readJson<RollbackLog>(path.join(this.rollbackDir, `${run_id}.json`));
  }

  private saveJob(job: Job): void {
    fs.writeFileSync(path.join(this.jobsDir, `${job.job_id}.json`), JSON.stringify(job, null, 2));
  }

  private readAllJobs(): Job[] {
    if (!fs.existsSync(this.jobsDir)) return [];
    return fs.readdirSync(this.jobsDir)
      .map((f) => this.readJson<Job>(path.join(this.jobsDir, f)))
      .filter((j): j is Job => j !== null);
  }

  private readJson<T>(p: string): T | null {
    if (!fs.existsSync(p)) return null;
    try { return JSON.parse(fs.readFileSync(p, "utf-8")) as T; } catch { return null; }
  }
}
