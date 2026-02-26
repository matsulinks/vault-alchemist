import { ItemView, WorkspaceLeaf, Notice } from "obsidian";
import type { ServiceClient } from "../api-client/service-client.js";

export const HOME_VIEW_TYPE = "vault-alchemist-home";

export class HomeView extends ItemView {
  private client: ServiceClient;

  constructor(leaf: WorkspaceLeaf, client: ServiceClient) {
    super(leaf);
    this.client = client;
  }

  getViewType(): string {
    return HOME_VIEW_TYPE;
  }

  getDisplayText(): string {
    return "Vault Alchemist";
  }

  getIcon(): string {
    return "book-open";
  }

  async onOpen(): Promise<void> {
    this.render();
  }

  private render(): void {
    const container = this.containerEl.children[1] as HTMLElement;
    container.empty();
    container.addClass("va-home");

    const header = container.createDiv("va-header");
    header.createEl("h1", { text: "📖 Vault Alchemist" });
    header.createEl("p", {
      text: "AIがVaultを整理しています 🌙",
      cls: "va-subtitle",
    });

    // Undo ボタン（T030）
    const undoSection = container.createDiv("va-undo-section");
    const lastRunId = this.getLastRunId();
    if (lastRunId) {
      const undoBtn = undoSection.createEl("button", {
        text: "↩ 直近の処理を元に戻す",
        cls: "va-btn va-btn-undo",
      });
      undoBtn.addEventListener("click", async () => {
        try {
          const vaultPath = (this.app.vault.adapter as any).basePath ?? "";
          // ロールバックは ServiceClient 経由
          new Notice("ロールバック機能はChat Cleanerから実行してください");
        } catch (e: any) {
          new Notice(`失敗: ${e.message}`);
        }
      });
    }

    // クイックアクション
    const actions = container.createDiv("va-actions");
    actions.createEl("h3", { text: "クイックアクション" });

    const openCleanerBtn = actions.createEl("button", {
      text: "Chat Cleaner を開く",
      cls: "va-btn va-btn-primary",
    });
    openCleanerBtn.addEventListener("click", () => {
      // コマンドIDで呼び出す
      (this.app as any).commands?.executeCommandById(
        "vault-alchemist:open-chat-cleaner"
      );
    });
  }

  private getLastRunId(): string | null {
    // ローカルストレージで直近の run_id を管理（シンプルな実装）
    return localStorage.getItem("va_last_run_id");
  }
}
