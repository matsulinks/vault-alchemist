import { ItemView, WorkspaceLeaf, TFile, Notice, setIcon } from "obsidian";
import type { EstimateResponse, RunResponse, ThreadPreview } from "@vault-alchemist/shared";
import type { ServiceClient } from "../api-client/service-client.js";

export const CHAT_CLEANER_VIEW_TYPE = "vault-alchemist-chat-cleaner";

export class ChatCleanerView extends ItemView {
  private client: ServiceClient;
  private vaultPath: string;
  private selectedNote: TFile | null = null;
  private lastEstimate: EstimateResponse | null = null;
  private lastRunResult: RunResponse | null = null;

  constructor(
    leaf: WorkspaceLeaf,
    client: ServiceClient,
    vaultPath: string
  ) {
    super(leaf);
    this.client = client;
    this.vaultPath = vaultPath;
  }

  getViewType(): string {
    return CHAT_CLEANER_VIEW_TYPE;
  }

  getDisplayText(): string {
    return "Chat Cleaner";
  }

  getIcon(): string {
    return "message-square";
  }

  async onOpen(): Promise<void> {
    this.render();
  }

  private render(): void {
    const container = this.containerEl.children[1] as HTMLElement;
    container.empty();
    container.addClass("va-chat-cleaner");

    this.renderHeader(container);
    this.renderNoteSelector(container);

    if (this.selectedNote) {
      this.renderEstimateSection(container);
    }

    if (this.lastRunResult) {
      this.renderRunResult(container);
    }
  }

  private renderHeader(container: HTMLElement): void {
    const header = container.createDiv("va-header");
    header.createEl("h2", { text: "Chat Cleaner" });
    header.createEl("p", {
      text: "会話ログをトピックごとに整理します",
      cls: "va-subtitle",
    });
  }

  private renderNoteSelector(container: HTMLElement): void {
    const section = container.createDiv("va-section");
    section.createEl("h3", { text: "対象ノートを選択" });

    // source_type=chat のノートを一覧表示
    const chatNotes = this.app.vault
      .getMarkdownFiles()
      .filter((f) => this.isChatNote(f));

    if (chatNotes.length === 0) {
      section.createEl("p", {
        text: "チャットノートが見つかりません。frontmatterに source_type: chat を設定してください。",
        cls: "va-empty",
      });
      return;
    }

    const list = section.createEl("select", { cls: "va-note-select" });
    list.createEl("option", { text: "-- ノートを選択 --", value: "" });
    for (const f of chatNotes) {
      const opt = list.createEl("option", { text: f.path, value: f.path });
      if (this.selectedNote?.path === f.path) opt.selected = true;
    }

    list.addEventListener("change", async () => {
      const path = list.value;
      this.selectedNote = path
        ? this.app.vault.getAbstractFileByPath(path) as TFile
        : null;
      this.lastEstimate = null;
      this.lastRunResult = null;
      this.render();
    });
  }

  private renderEstimateSection(container: HTMLElement): void {
    const section = container.createDiv("va-section");
    section.createEl("h3", { text: "事前スキャン（T026）" });

    if (!this.lastEstimate) {
      const btn = section.createEl("button", {
        text: "Estimate（推定）",
        cls: "va-btn va-btn-primary",
      });
      btn.addEventListener("click", () => this.runEstimate(section));
      return;
    }

    const e = this.lastEstimate;
    const info = section.createDiv("va-estimate-info");
    info.createEl("p", { text: `推定スレッド数: ${e.estimatedThreadCount}` });
    info.createEl("p", {
      text: `推定処理時間: ${e.estimatedDurationSec}秒`,
    });
    if (e.hasPersonalData) {
      info.createEl("p", {
        text: "⚠ 個人情報の可能性あり",
        cls: "va-warning",
      });
    }

    this.renderRunSection(section);
  }

  private renderRunSection(container: HTMLElement): void {
    const section = container.createDiv("va-run-section");
    section.createEl("p", {
      text: "これは試運転（dry-run）です。実際のファイル変更は行われません。",
      cls: "va-notice-safe",
    });

    const btnRow = section.createDiv("va-btn-row");

    const dryBtn = btnRow.createEl("button", {
      text: "おすすめで進める（Dry Run）",
      cls: "va-btn va-btn-primary",
    });
    dryBtn.addEventListener("click", () => this.runDryRun());

    const applyBtn = btnRow.createEl("button", {
      text: "適用する（In Place）",
      cls: "va-btn va-btn-secondary",
    });
    applyBtn.addEventListener("click", () => this.runInPlace());

    const newFilesBtn = btnRow.createEl("button", {
      text: "新規ファイルとして保存",
      cls: "va-btn va-btn-secondary",
    });
    newFilesBtn.addEventListener("click", () => this.runNewFiles());
  }

  private renderRunResult(container: HTMLElement): void {
    const result = this.lastRunResult!;
    const section = container.createDiv("va-section va-result");
    section.createEl("h3", { text: "実行結果" });

    const modeLabel =
      result.applyMode === "dry_run"
        ? "プレビュー（dry-run）"
        : result.applyMode === "in_place"
        ? "適用済み（in-place）"
        : "新規ファイル生成";

    section.createEl("p", { text: `モード: ${modeLabel}` });
    section.createEl("p", {
      text: `スレッド数: ${result.threads.length}`,
    });

    if (result.costUsd !== undefined) {
      const jpy = Math.round(result.costUsd * 150);
      section.createEl("p", { text: `コスト: ¥${jpy}（推定）` });
    }

    this.renderThreadPreviews(section, result.threads);

    if (result.applyMode !== "dry_run") {
      this.renderUndoButton(section, result.run_id);
    } else {
      this.renderApplyChoice(section);
    }
  }

  private renderThreadPreviews(
    container: HTMLElement,
    threads: ThreadPreview[]
  ): void {
    const list = container.createDiv("va-thread-list");
    for (const t of threads) {
      const item = list.createDiv("va-thread-item");
      const scoreClass =
        t.boundaryScore >= 0.7
          ? "va-score-confirmed"
          : t.boundaryScore >= 0.4
          ? "va-score-candidate"
          : "va-score-none";
      item.createEl("span", {
        text: t.boundaryScore >= 0.4 ? "⚠" : "✓",
        cls: `va-score-icon ${scoreClass}`,
      });
      item.createEl("strong", { text: t.title });
      item.createEl("p", { text: t.topic, cls: "va-topic" });
      item.createEl("p", { text: `${t.messageCount}メッセージ`, cls: "va-meta" });
      if (t.summary) {
        item.createEl("p", { text: t.summary, cls: "va-summary" });
      }
    }
  }

  private renderApplyChoice(container: HTMLElement): void {
    const box = container.createDiv("va-apply-choice");
    box.createEl("p", { text: "こんな感じで整理できます。実際に適用しますか？" });

    const btnRow = box.createDiv("va-btn-row");
    const applyBtn = btnRow.createEl("button", {
      text: "▶ 適用する（In Place）",
      cls: "va-btn va-btn-primary",
    });
    applyBtn.addEventListener("click", () => this.runInPlace());

    const newBtn = btnRow.createEl("button", {
      text: "▶ 新規ファイルとして保存",
      cls: "va-btn va-btn-secondary",
    });
    newBtn.addEventListener("click", () => this.runNewFiles());

    const cancelBtn = btnRow.createEl("button", {
      text: "▶ 今回はやめる",
      cls: "va-btn va-btn-ghost",
    });
    cancelBtn.addEventListener("click", () => {
      this.lastRunResult = null;
      this.render();
    });
  }

  private renderUndoButton(container: HTMLElement, run_id: string): void {
    const undoBtn = container.createEl("button", {
      text: "↩ Undo（元に戻す）",
      cls: "va-btn va-btn-undo",
    });
    undoBtn.addEventListener("click", async () => {
      try {
        const res = await this.client.rollback(run_id);
        new Notice(`ロールバック完了: ${res.restoredPath}`);
        this.lastRunResult = null;
        this.render();
      } catch (e: any) {
        new Notice(`ロールバック失敗: ${e.message}`);
      }
    });
  }

  private async runEstimate(container: HTMLElement): Promise<void> {
    if (!this.selectedNote) return;
    try {
      const btn = container.querySelector(".va-btn-primary") as HTMLElement;
      if (btn) btn.textContent = "スキャン中...";
      this.lastEstimate = await this.client.estimate(this.selectedNote.path);
      this.render();
    } catch (e: any) {
      new Notice(`Estimate 失敗: ${e.message}`);
    }
  }

  private async runDryRun(): Promise<void> {
    if (!this.selectedNote) return;
    try {
      this.lastRunResult = await this.client.run({
        notePath: this.selectedNote.path,
        applyMode: "dry_run",
        precision: "fast",
      });
      this.render();
    } catch (e: any) {
      new Notice(`実行失敗: ${e.message}`);
    }
  }

  private async runInPlace(): Promise<void> {
    if (!this.selectedNote) return;
    try {
      this.lastRunResult = await this.client.run({
        notePath: this.selectedNote.path,
        applyMode: "in_place",
        precision: "fast",
      });
      new Notice("適用完了！ファイルが分割されました。");
      this.render();
    } catch (e: any) {
      new Notice(`適用失敗: ${e.message}`);
    }
  }

  private async runNewFiles(): Promise<void> {
    if (!this.selectedNote) return;
    try {
      this.lastRunResult = await this.client.run({
        notePath: this.selectedNote.path,
        applyMode: "new_files",
        precision: "fast",
      });
      new Notice("新規ファイルとして生成完了！");
      this.render();
    } catch (e: any) {
      new Notice(`生成失敗: ${e.message}`);
    }
  }

  private isChatNote(file: TFile): boolean {
    const cache = this.app.metadataCache.getFileCache(file);
    const fm = cache?.frontmatter;
    return fm?.source_type === "chat";
  }
}
