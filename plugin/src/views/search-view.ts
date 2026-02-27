import { ItemView, WorkspaceLeaf, Notice } from "obsidian";
import type { SearchResultItem } from "@vault-alchemist/shared";
import type { ServiceClient } from "../api-client/service-client.js";

export const SEARCH_VIEW_TYPE = "vault-alchemist-search";

export class SearchView extends ItemView {
  private results: SearchResultItem[] = [];
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private resultsEl!: HTMLElement;

  constructor(leaf: WorkspaceLeaf, private client: ServiceClient) {
    super(leaf);
  }

  getViewType(): string { return SEARCH_VIEW_TYPE; }
  getDisplayText(): string { return "Semantic Search"; }
  getIcon(): string { return "search"; }

  async onOpen(): Promise<void> {
    const container = this.containerEl.children[1] as HTMLElement;
    container.empty();
    container.addClass("va-search");

    container.createEl("h2", { text: "🔍 Semantic Search" });

    const input = container.createEl("input", {
      type: "text",
      placeholder: "ノートの内容を自然文で検索…",
      cls: "va-search-input",
    });
    input.addEventListener("input", () => {
      if (this.debounceTimer) clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => this.runSearch(input.value.trim()), 300);
    });

    this.resultsEl = container.createDiv("va-search-results");
    this.renderResults();
  }

  private async runSearch(query: string): Promise<void> {
    if (!query) {
      this.results = [];
      this.renderResults();
      return;
    }
    try {
      const res = await this.client.search(query, 10);
      this.results = res.results;
    } catch (e: any) {
      new Notice(`検索エラー: ${e.message}`);
      this.results = [];
    }
    this.renderResults();
  }

  private renderResults(): void {
    this.resultsEl.empty();

    if (!this.results.length) {
      this.resultsEl.createEl("p", { text: "見つかりませんでした", cls: "va-empty" });
      return;
    }

    for (const item of this.results) {
      const card = this.resultsEl.createDiv("va-result-card");
      card.addEventListener("click", () => this.openNote(item.notePath, card));

      const fileName = item.notePath.split("/").pop() ?? item.notePath;
      card.createEl("strong", { text: fileName, cls: "va-result-title" });
      card.createEl("p", {
        text: item.text.slice(0, 100) + (item.text.length > 100 ? "…" : ""),
        cls: "va-result-snippet",
      });
      card.createEl("span", {
        text: `${(item.score * 100).toFixed(0)}%`,
        cls: "va-result-score",
      });
    }
  }

  private openNote(notePath: string, card: HTMLElement): void {
    this.resultsEl.querySelectorAll(".is-active").forEach((el) => el.removeClass("is-active"));
    card.addClass("is-active");
    this.app.workspace.openLinkText(notePath, "", false);
  }
}
