import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";
import type {
  RunRequest,
  RunResponse,
  ThreadPreview,
  RollbackRequest,
  RollbackResponse,
  LLMProvider,
} from "@vault-alchemist/shared";
import { parseChatMarkdown } from "./chat-parser.js";
import { buildThreads, threadToMarkdown, threadToPreview, type Thread } from "./thread-builder.js";
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

    if (!fs.existsSync(fullPath)) throw new Error(`Note not found: ${req.notePath}`);

    const content = fs.readFileSync(fullPath, "utf-8");
    const threads = buildThreads(parseChatMarkdown(content), req.precision ?? "fast");

    let totalCost = 0;
    const previews: ThreadPreview[] = [];
    for (let i = 0; i < threads.length; i++) {
      let title = `Thread ${i + 1}`, topic = "（未分類）", summary = "";
      if (this.provider) {
        try {
          const cover = await generateCover(threads[i], this.provider);
          title = cover.titles[0] ?? title;
          topic = cover.topic;
          summary = cover.summary;
          totalCost += cover.costUsd;
        } catch { /* フォールバック */ }
      }
      previews.push(threadToPreview(threads[i], title, topic, summary));
    }

    const base: RunResponse = {
      run_id, notePath: req.notePath, applyMode: req.applyMode,
      threads: previews, costUsd: totalCost, durationMs: Date.now() - startMs,
    };

    if (req.applyMode === "dry_run") return base;

    this.jobStore.saveRollbackLog({
      run_id, original_note_path: req.notePath,
      before_hash: hashContent(content), after_hash: "",
      before_content: content, index_note_content: "",
      created_thread_notes: [], rollback_policy: req.rollbackPolicy ?? "delete_threads",
      created_at: new Date().toISOString(),
    });

    return this.applyFiles(req, run_id, threads, previews, base, req.applyMode === "in_place");
  }

  private applyFiles(
    req: RunRequest, run_id: string,
    threads: Thread[], previews: ThreadPreview[],
    base: RunResponse, inPlace: boolean
  ): RunResponse {
    const baseName = path.basename(req.notePath, ".md");
    const outDir = inPlace
      ? path.join(this.vaultPath, path.dirname(req.notePath))
      : path.join(this.vaultPath, "_alchemy", "curated", baseName);

    if (!inPlace) fs.mkdirSync(outDir, { recursive: true });

    const createdPaths: string[] = [];
    const createdThreadNotes: { path: string; title: string; hash: string }[] = [];

    for (let i = 0; i < threads.length; i++) {
      const fname = inPlace ? `${baseName}_thread_${i + 1}.md` : `thread_${i + 1}.md`;
      const relPath = inPlace
        ? path.join(path.dirname(req.notePath), fname)
        : path.join("_alchemy", "curated", baseName, fname);
      const threadContent = this.buildThreadNote(threads[i], previews[i]);
      fs.writeFileSync(path.join(outDir, fname), threadContent, "utf-8");
      createdPaths.push(relPath);
      createdThreadNotes.push({ path: relPath, title: previews[i].title, hash: hashContent(threadContent) });
    }

    const log = this.jobStore.getRollbackLog(run_id)!;
    log.created_thread_notes = createdThreadNotes;

    let indexNotePath: string | undefined;
    if (inPlace) {
      const indexContent = this.buildIndexNote(baseName, previews, createdPaths);
      fs.writeFileSync(path.join(this.vaultPath, req.notePath), indexContent, "utf-8");
      log.after_hash = hashContent(indexContent);
      log.index_note_content = indexContent;
      indexNotePath = req.notePath;
    }

    this.jobStore.saveRollbackLog(log);
    return { ...base, appliedPaths: createdPaths, indexNotePath };
  }

  async rollback(req: RollbackRequest): Promise<RollbackResponse> {
    const log = this.jobStore.getRollbackLog(req.run_id);
    if (!log) throw new Error(`Rollback log not found: ${req.run_id}`);

    fs.writeFileSync(path.join(this.vaultPath, log.original_note_path), log.before_content, "utf-8");

    const deletedPaths: string[] = [];
    for (const t of log.created_thread_notes) {
      const tp = path.join(this.vaultPath, t.path);
      if (!fs.existsSync(tp)) continue;
      if (log.rollback_policy === "move_to_archive") {
        const archiveDir = path.join(this.vaultPath, "_alchemy", "archive");
        fs.mkdirSync(archiveDir, { recursive: true });
        fs.renameSync(tp, path.join(archiveDir, path.basename(tp)));
      } else {
        fs.unlinkSync(tp);
      }
      deletedPaths.push(t.path);
    }
    return { success: true, restoredPath: log.original_note_path, deletedPaths };
  }

  private buildThreadNote(thread: Thread, preview: ThreadPreview): string {
    const fm = `---\nsource_type: chat\ntopic: "${preview.topic}"\nsummary: |\n${
      preview.summary.split("\n").map((l) => `  ${l}`).join("\n")
    }\n---\n\n`;
    return fm + threadToMarkdown(thread, preview.title);
  }

  private buildIndexNote(baseName: string, previews: ThreadPreview[], threadPaths: string[]): string {
    const links = previews.map((p, i) => `- [[${threadPaths[i]}|${p.title}]] — ${p.topic}`).join("\n");
    return `# ${baseName}（分割済み）\n\n> Vault Alchemist によって分割されました。\n\n## スレッド一覧\n\n${links}\n`;
  }
}
