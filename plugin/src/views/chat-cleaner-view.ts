import { ItemView, WorkspaceLeaf, TFile, Notice } from "obsidian";
import type { EstimateResponse, RunResponse, ThreadPreview, ApplyMode } from "@vault-alchemist/shared";
import type { ServiceClient } from "../api-client/service-client.js";

export const CHAT_CLEANER_VIEW_TYPE = "vault-alchemist-chat-cleaner";

export class ChatCleanerView extends ItemView {
  private selectedNote: TFile | null = null;
  private lastEstimate: EstimateResponse | null = null;
  private lastRunResult: RunResponse | null = null;

  constructor(leaf: WorkspaceLeaf, private client: ServiceClient, private vaultPath: string) {
    super(leaf);
  }

  getViewType() { return CHAT_CLEANER_VIEW_TYPE; }
  getDisplayText() { return "Chat Cleaner"; }
  getIcon() { return "message-square"; }
  async onOpen() { this.render(); }

  private render(): void {
    const root = this.containerEl.children[1] as HTMLElement;
    root.empty();
    root.addClass("va-chat-cleaner");

    root.createEl("h2", { text: "Chat Cleaner" });
    root.createEl("p", { text: "会話ログをトピックごとに整理します", cls: "va-subtitle" });

    this.renderSelector(root);
    if (this.selectedNote) this.renderEstimate(root);
    if (this.lastRunResult) this.renderResult(root);
  }

  private renderSelector(root: HTMLElement): void {
    const sec = root.createDiv("va-section");
    sec.createEl("h3", { text: "対象ノートを選択" });
    const notes = this.app.vault.getMarkdownFiles().filter((f) =>
      this.app.metadataCache.getFileCache(f)?.frontmatter?.source_type === "chat"
    );
    if (!notes.length) {
      sec.createEl("p", { text: "チャットノートが見つかりません（frontmatter: source_type: chat が必要）", cls: "va-empty" });
      return;
    }
    const sel = sec.createEl("select", { cls: "va-note-select" });
    sel.createEl("option", { text: "-- ノートを選択 --", value: "" });
    for (const f of notes) {
      const opt = sel.createEl("option", { text: f.path, value: f.path });
      if (this.selectedNote?.path === f.path) opt.selected = true;
    }
    sel.addEventListener("change", () => {
      this.selectedNote = sel.value ? this.app.vault.getAbstractFileByPath(sel.value) as TFile : null;
      this.lastEstimate = null;
      this.lastRunResult = null;
      this.render();
    });
  }

  private renderEstimate(root: HTMLElement): void {
    const sec = root.createDiv("va-section");
    sec.createEl("h3", { text: "事前スキャン" });
    if (!this.lastEstimate) {
      this.btn(sec, "Estimate（推定）", "va-btn-primary", async () => {
        this.lastEstimate = await this.call(() => this.client.estimate(this.selectedNote!.path));
        this.render();
      });
      return;
    }
    const e = this.lastEstimate;
    sec.createEl("p", { text: `推定スレッド数: ${e.estimatedThreadCount} / 推定時間: ${e.estimatedDurationSec}秒` });
    if (e.hasPersonalData) sec.createEl("p", { text: "⚠ 個人情報の可能性あり", cls: "va-warning" });

    sec.createEl("p", { text: "これは試運転（dry-run）です。ファイルは変更されません。", cls: "va-notice-safe" });
    const row = sec.createDiv("va-btn-row");
    this.btn(row, "おすすめで進める（Dry Run）", "va-btn-primary", () => this.execRun("dry_run"));
    this.btn(row, "適用する（In Place）", "va-btn-secondary", () => this.execRun("in_place"));
    this.btn(row, "新規ファイルとして保存", "va-btn-secondary", () => this.execRun("new_files"));
  }

  private renderResult(root: HTMLElement): void {
    const r = this.lastRunResult!;
    const sec = root.createDiv("va-section va-result");
    const modeLabel = { dry_run: "プレビュー", in_place: "適用済み", new_files: "新規生成" }[r.applyMode];
    sec.createEl("h3", { text: `実行結果（${modeLabel}）` });
    sec.createEl("p", { text: `スレッド数: ${r.threads.length}` });
    if (r.costUsd !== undefined) sec.createEl("p", { text: `コスト: ¥${Math.round(r.costUsd * 150)}（推定）` });

    const list = sec.createDiv("va-thread-list");
    for (const t of r.threads) {
      const item = list.createDiv("va-thread-item");
      item.createEl("span", { text: t.boundaryScore >= 0.4 ? "⚠" : "✓", cls: `va-score-icon` });
      item.createEl("strong", { text: t.title });
      item.createEl("p", { text: `${t.topic} · ${t.messageCount}件`, cls: "va-meta" });
      if (t.summary) item.createEl("p", { text: t.summary, cls: "va-summary" });
    }

    if (r.applyMode !== "dry_run") {
      this.btn(sec, "↩ Undo（元に戻す）", "va-btn-undo", async () => {
        const res = await this.call(() => this.client.rollback(r.run_id));
        if (res) { new Notice(`ロールバック完了: ${res.restoredPath}`); this.lastRunResult = null; this.render(); }
      });
    } else {
      sec.createEl("p", { text: "こんな感じで整理できます。実際に適用しますか？" });
      const row = sec.createDiv("va-btn-row");
      this.btn(row, "▶ 適用する（In Place）", "va-btn-primary", () => this.execRun("in_place"));
      this.btn(row, "▶ 新規ファイルとして保存", "va-btn-secondary", () => this.execRun("new_files"));
      this.btn(row, "▶ 今回はやめる", "va-btn-ghost", () => { this.lastRunResult = null; this.render(); });
    }
  }

  private async execRun(mode: ApplyMode): Promise<void> {
    const result = await this.call(() =>
      this.client.run({ notePath: this.selectedNote!.path, applyMode: mode, precision: "fast" })
    );
    if (result) {
      this.lastRunResult = result;
      if (mode !== "dry_run") new Notice(mode === "in_place" ? "適用完了！" : "新規ファイル生成完了！");
      this.render();
    }
  }

  private btn(parent: HTMLElement, text: string, cls: string, onClick: () => void): HTMLButtonElement {
    const b = parent.createEl("button", { text, cls: `va-btn ${cls}` });
    b.addEventListener("click", onClick);
    return b;
  }

  private async call<T>(fn: () => Promise<T>): Promise<T | null> {
    try { return await fn(); }
    catch (e: any) { new Notice(`エラー: ${e.message}`); return null; }
  }
}
