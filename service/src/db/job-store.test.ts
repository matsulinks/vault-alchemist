import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { JobStore } from "./job-store.js";
import type { RollbackLog } from "@vault-alchemist/shared";

let tmpDir: string;
let store: JobStore;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "va-test-"));
  store = new JobStore(tmpDir);
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("JobStore", () => {
  it("ジョブを作成して取得できる", () => {
    const job = store.createJob({
      run_id: "run-001",
      job_type: "chat_recompose",
      target: "notes/test.md",
    });

    expect(job.job_id).toBeTruthy();
    expect(job.status).toBe("pending");
    expect(job.retry_count).toBe(0);

    const fetched = store.getJob(job.job_id);
    expect(fetched).not.toBeNull();
    expect(fetched?.run_id).toBe("run-001");
  });

  it("ジョブのステータスを更新できる", () => {
    const job = store.createJob({
      run_id: "run-002",
      job_type: "cover_generate",
      target: "notes/test.md",
    });

    const updated = store.updateJob(job.job_id, {
      status: "completed",
      finished_at: new Date().toISOString(),
      cost_actual_usd: 0.001,
    });

    expect(updated.status).toBe("completed");
    expect(updated.cost_actual_usd).toBe(0.001);

    const fetched = store.getJob(job.job_id);
    expect(fetched?.status).toBe("completed");
  });

  it("存在しない job_id を更新するとエラー", () => {
    expect(() => store.updateJob("nonexistent", { status: "completed" })).toThrow();
  });

  it("同じ hash_snapshot + job_type の完了済みジョブがあれば isAlreadyDone が true", () => {
    const job = store.createJob({
      run_id: "run-003",
      job_type: "chat_recompose",
      target: "notes/test.md",
      hash_snapshot: "abc123",
    });
    store.updateJob(job.job_id, { status: "completed" });

    expect(store.isAlreadyDone("abc123", "chat_recompose")).toBe(true);
  });

  it("未完了ジョブは isAlreadyDone が false", () => {
    store.createJob({
      run_id: "run-004",
      job_type: "chat_recompose",
      target: "notes/test.md",
      hash_snapshot: "def456",
    });
    // status は pending のまま
    expect(store.isAlreadyDone("def456", "chat_recompose")).toBe(false);
  });

  it("run_id でジョブ一覧を取得できる", () => {
    store.createJob({ run_id: "run-A", job_type: "chat_recompose", target: "a.md" });
    store.createJob({ run_id: "run-A", job_type: "cover_generate", target: "a.md" });
    store.createJob({ run_id: "run-B", job_type: "chat_recompose", target: "b.md" });

    const jobs = store.listByRunId("run-A");
    expect(jobs).toHaveLength(2);
    expect(jobs.every((j) => j.run_id === "run-A")).toBe(true);
  });

  it("ロールバックログを保存して取得できる", () => {
    const log: RollbackLog = {
      run_id: "run-X",
      original_note_path: "notes/chat.md",
      before_hash: "hash_before",
      after_hash: "hash_after",
      before_content: "# 元の内容\nUser: hello",
      index_note_content: "# 目次",
      created_thread_notes: [
        { path: "notes/chat_thread_1.md", title: "スレッド1", hash: "h1" },
      ],
      rollback_policy: "delete_threads",
      created_at: new Date().toISOString(),
    };

    store.saveRollbackLog(log);
    const fetched = store.getRollbackLog("run-X");

    expect(fetched).not.toBeNull();
    expect(fetched?.before_content).toBe("# 元の内容\nUser: hello");
    expect(fetched?.created_thread_notes).toHaveLength(1);
  });

  it("存在しない run_id のロールバックログは null", () => {
    expect(store.getRollbackLog("nonexistent")).toBeNull();
  });
});
