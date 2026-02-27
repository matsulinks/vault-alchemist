import { ItemView, WorkspaceLeaf, Notice } from "obsidian";
import type { RecentRunItem } from "@vault-alchemist/shared";
import type { ServiceClient } from "../api-client/service-client.js";

export const HOME_VIEW_TYPE = "vault-alchemist-home";

export class HomeView extends ItemView {
  private recentRuns: RecentRunItem[] = [];

  constructor(leaf: WorkspaceLeaf, private client: ServiceClient) {
    super(leaf);
  }

  getViewType(): string { return HOME_VIEW_TYPE; }
  getDisplayText(): string { return "Vault Alchemist"; }
  getIcon(): string { return "book-open"; }

  async onOpen(): Promise<void> {
    await this.fetchRecentRuns();
    this.render();
  }

  private async fetchRecentRuns(): Promise<void> {
    try {
      const res = await this.client.recentRuns(24);
      this.recentRuns = res.items;
    } catch {
      this.recentRuns = [];
    }
  }

  private render(): void {
    const container = this.containerEl.children[1] as HTMLElement;
    container.empty();
    container.addClass("va-home");

    const header = container.createDiv("va-header");
    header.createEl("h1", { text: "📖 Vault Alchemist" });
    header.createEl("p", { text: "AIがVaultを整理しています 🌙", cls: "va-subtitle" });

    this.renderRecentWork(container);
    this.renderActions(container);
  }

  private renderRecentWork(container: HTMLElement): void {
    const sec = container.createDiv("va-section");
    sec.createEl("h3", { text: "昨夜やったこと" });

    if (!this.recentRuns.length) {
      sec.createEl("p", { text: "直近24時間の処理はありません", cls: "va-empty" });
      return;
    }

    const list = sec.createDiv("va-recent-list");
    for (const run of this.recentRuns) {
      const item = list.createDiv("va-recent-item");

      const meta = item.createDiv("va-recent-meta");
      meta.createEl("strong", { text: run.notePath });
      meta.createEl("span", {
        text: `  ${run.threadCount}スレッドに分割 · ${this.formatTime(run.createdAt)}`,
        cls: "va-meta",
      });

      if (run.threadTitles.length) {
        const titles = item.createDiv("va-recent-titles");
        for (const title of run.threadTitles.slice(0, 3)) {
          titles.createEl("p", { text: `· ${title}`, cls: "va-thread-title" });
        }
        if (run.threadTitles.length > 3) {
          titles.createEl("p", {
            text: `  …他${run.threadTitles.length - 3}件`,
            cls: "va-meta",
          });
        }
      }

      const undoBtn = item.createEl("button", {
        text: "↩ Undo",
        cls: "va-btn va-btn-undo",
      });
      undoBtn.addEventListener("click", async () => {
        undoBtn.disabled = true;
        undoBtn.textContent = "戻し中...";
        try {
          const res = await this.client.rollback(run.run_id);
          new Notice(`ロールバック完了: ${res.restoredPath}`);
          this.recentRuns = this.recentRuns.filter((r) => r.run_id !== run.run_id);
          this.render();
        } catch (e: any) {
          new Notice(`失敗: ${e.message}`);
          undoBtn.disabled = false;
          undoBtn.textContent = "↩ Undo";
        }
      });
    }
  }

  private renderActions(container: HTMLElement): void {
    const sec = container.createDiv("va-section va-actions");
    sec.createEl("h3", { text: "クイックアクション" });

    const openCleanerBtn = sec.createEl("button", {
      text: "Chat Cleaner を開く",
      cls: "va-btn va-btn-primary",
    });
    openCleanerBtn.addEventListener("click", () => {
      (this.app as any).commands?.executeCommandById("vault-alchemist:open-chat-cleaner");
    });
  }

  private formatTime(iso: string): string {
    const diffH = Math.floor((Date.now() - new Date(iso).getTime()) / 3600000);
    if (diffH < 1) return "先ほど";
    if (diffH < 24) return `${diffH}時間前`;
    return `${Math.floor(diffH / 24)}日前`;
  }
}
