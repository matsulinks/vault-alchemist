import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import type {
  ApplyMode,
  RunRequest,
  RunResponse,
  ThreadPreview,
  RollbackRequest,
  RollbackResponse,
} from "@vault-alchemist/shared";
import type { LLMProvider } from "@vault-alchemist/shared";
import { parseChatMarkdown } from "./chat-parser.js";
import { buildThreads, threadToMarkdown, threadToPreview } from "./thread-builder.js";
import { generateCover } from "./cover-generator.js";
import { hashContent } from "./estimator.js";
import { JobStore } from "../db/job-store.js";

export class ApplyEngine {
  constructor(
    private vaultPath: string,
    private jobStore: JobStore,
    private provider: LLMProvider | null
  ) {}

  async run(req: RunRequest): Promise<RunResponse> {
    const startMs = Date.now();
    const run_id = crypto.randomUUID();
    const fullPath = path.join(this.vaultPath, req.notePath);

    if (!fs.existsSync(fullPath)) {
      throw new Error(`Note not found: ${req.notePath}`);
    }

    const content = fs.readFileSync(fullPath, "utf-8");
    const messages = parseChatMarkdown(content);
    const threads = buildThreads(messages, req.precision ?? "fast");

    // 表紙生成（プロバイダがある場合のみ）
    const previews: ThreadPreview[] = [];
    let totalCost = 0;

    for (const thread of threads) {
      let title = `Thread ${thread.startIndex + 1}`;
      let topic = "（未分類）";
      let summary = "";

      if (this.provider) {
        try {
          const cover = await generateCover(thread, this.provider);
          title = cover.titles[0] ?? title;
          topic = cover.topic;
          summary = cover.summary;
          totalCost += cover.costUsd;
        } catch (e) {
          console.warn("[vault-alchemist] cover gen failed:", e);
        }
      }

      previews.push(threadToPreview(thread, title, topic, summary));
    }

    const response: RunResponse = {
      run_id,
      notePath: req.notePath,
      applyMode: req.applyMode,
      threads: previews,
      costUsd: totalCost,
      durationMs: Date.now() - startMs,
    };

    if (req.applyMode === "dry_run") {
      return response;
    }

    // ロールバックログを先に保存（T021）
    const beforeHash = hashContent(content);
    this.jobStore.saveRollbackLog({
      run_id,
      original_note_path: req.notePath,
      before_hash: beforeHash,
      after_hash: "",
      before_content: content,
      index_note_content: "",
      created_thread_notes: [],
      rollback_policy: req.rollbackPolicy ?? "delete_threads",
      created_at: new Date().toISOString(),
    });

    if (req.applyMode === "in_place") {
      return await this.applyInPlace(req, run_id, content, threads, previews, response);
    } else {
      return await this.applyNewFiles(req, run_id, content, threads, previews, response);
    }
  }

  private async applyInPlace(
    req: RunRequest,
    run_id: string,
    originalContent: string,
    threads: import("./thread-builder.js").Thread[],
    previews: ThreadPreview[],
    base: RunResponse
  ): Promise<RunResponse> {
    const baseName = path.basename(req.notePath, ".md");
    const dirName = path.dirname(req.notePath);
    const createdPaths: string[] = [];
    const createdThreadNotes: { path: string; title: string; hash: string }[] = [];

    // スレッドノートを生成
    for (let i = 0; i < threads.length; i++) {
      const thread = threads[i];
      const preview = previews[i];
      const threadName = `${baseName}_thread_${i + 1}.md`;
      const threadPath = path.join(this.vaultPath, dirName, threadName);
      const threadContent = this.buildThreadNote(thread, preview);
      fs.writeFileSync(threadPath, threadContent, "utf-8");
      const hash = hashContent(threadContent);
      createdPaths.push(path.join(dirName, threadName));
      createdThreadNotes.push({ path: path.join(dirName, threadName), title: preview.title, hash });
    }

    // 目次ノート（元ノートを置き換え）
    const indexContent = this.buildIndexNote(baseName, previews, createdPaths);
    const fullPath = path.join(this.vaultPath, req.notePath);
    fs.writeFileSync(fullPath, indexContent, "utf-8");

    // ロールバックログを更新
    const log = this.jobStore.getRollbackLog(run_id)!;
    log.after_hash = hashContent(indexContent);
    log.index_note_content = indexContent;
    log.created_thread_notes = createdThreadNotes;
    this.jobStore.saveRollbackLog(log);

    return {
      ...base,
      appliedPaths: createdPaths,
      indexNotePath: req.notePath,
    };
  }

  private async applyNewFiles(
    req: RunRequest,
    run_id: string,
    _originalContent: string,
    threads: import("./thread-builder.js").Thread[],
    previews: ThreadPreview[],
    base: RunResponse
  ): Promise<RunResponse> {
    const baseName = path.basename(req.notePath, ".md");
    const curatedDir = path.join(this.vaultPath, "_alchemy", "curated", baseName);
    fs.mkdirSync(curatedDir, { recursive: true });

    const createdPaths: string[] = [];
    const createdThreadNotes: { path: string; title: string; hash: string }[] = [];

    for (let i = 0; i < threads.length; i++) {
      const thread = threads[i];
      const preview = previews[i];
      const threadName = `thread_${i + 1}.md`;
      const fullThreadPath = path.join(curatedDir, threadName);
      const relativePath = path.join("_alchemy", "curated", baseName, threadName);
      const threadContent = this.buildThreadNote(thread, preview);
      fs.writeFileSync(fullThreadPath, threadContent, "utf-8");
      const hash = hashContent(threadContent);
      createdPaths.push(relativePath);
      createdThreadNotes.push({ path: relativePath, title: preview.title, hash });
    }

    // ロールバックログを更新
    const log = this.jobStore.getRollbackLog(run_id)!;
    log.created_thread_notes = createdThreadNotes;
    this.jobStore.saveRollbackLog(log);

    return { ...base, appliedPaths: createdPaths };
  }

  async rollback(req: RollbackRequest): Promise<RollbackResponse> {
    const log = this.jobStore.getRollbackLog(req.run_id);
    if (!log) throw new Error(`Rollback log not found: ${req.run_id}`);

    const fullPath = path.join(this.vaultPath, log.original_note_path);
    fs.writeFileSync(fullPath, log.before_content, "utf-8");

    const deletedPaths: string[] = [];
    for (const thread of log.created_thread_notes) {
      const tp = path.join(this.vaultPath, thread.path);
      if (fs.existsSync(tp)) {
        if (log.rollback_policy === "move_to_archive") {
          const archiveDir = path.join(this.vaultPath, "_alchemy", "archive");
          fs.mkdirSync(archiveDir, { recursive: true });
          fs.renameSync(tp, path.join(archiveDir, path.basename(tp)));
        } else {
          fs.unlinkSync(tp);
        }
        deletedPaths.push(thread.path);
      }
    }

    return {
      success: true,
      restoredPath: log.original_note_path,
      deletedPaths,
    };
  }

  private buildThreadNote(
    thread: import("./thread-builder.js").Thread,
    preview: ThreadPreview
  ): string {
    const frontmatter = [
      "---",
      `source_type: chat`,
      `topic: "${preview.topic}"`,
      `summary: |`,
      ...preview.summary.split("\n").map((l) => `  ${l}`),
      "---",
      "",
    ].join("\n");
    return frontmatter + threadToMarkdown(thread, preview.title);
  }

  private buildIndexNote(
    baseName: string,
    previews: ThreadPreview[],
    threadPaths: string[]
  ): string {
    const lines = [
      `# ${baseName}（分割済み）`,
      "",
      `> このノートは Vault Alchemist によって分割されました。`,
      "",
      "## スレッド一覧",
      "",
    ];
    for (let i = 0; i < previews.length; i++) {
      const p = previews[i];
      const link = threadPaths[i] ? `[[${threadPaths[i]}|${p.title}]]` : p.title;
      lines.push(`- ${link} — ${p.topic}`);
    }
    return lines.join("\n") + "\n";
  }
}
