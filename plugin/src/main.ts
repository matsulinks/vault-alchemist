import { Plugin, Notice, WorkspaceLeaf } from "obsidian";
import { ServiceManager } from "./service-manager.js";
import { ServiceClient } from "./api-client/service-client.js";
import { VaultAlchemistSettings, DEFAULT_SETTINGS } from "./settings.js";
import { VaultAlchemistSettingTab } from "./settings-tab.js";
import {
  ChatCleanerView,
  CHAT_CLEANER_VIEW_TYPE,
} from "./views/chat-cleaner-view.js";
import { HomeView, HOME_VIEW_TYPE } from "./views/home-view.js";

export default class VaultAlchemistPlugin extends Plugin {
  settings!: VaultAlchemistSettings;
  private serviceManager!: ServiceManager;
  private client!: ServiceClient;

  async onload() {
    await this.loadSettings();

    this.serviceManager = new ServiceManager(this.app, this.settings);
    await this.serviceManager.start();
    await this.saveSettings(); // firstLaunchDone の保存

    const vaultPath =
      (this.app.vault.adapter as any).basePath ?? "";
    this.client = new ServiceClient(
      this.serviceManager.getBaseUrl(),
      vaultPath,
      this.settings.openaiApiKey || undefined
    );

    // ビューの登録
    this.registerView(HOME_VIEW_TYPE, (leaf: WorkspaceLeaf) => {
      return new HomeView(leaf, this.client);
    });
    this.registerView(CHAT_CLEANER_VIEW_TYPE, (leaf: WorkspaceLeaf) => {
      return new ChatCleanerView(leaf, this.client, vaultPath);
    });

    // コマンド登録
    this.addCommand({
      id: "open-home",
      name: "Open Home",
      callback: () => this.activateView(HOME_VIEW_TYPE),
    });

    this.addCommand({
      id: "open-chat-cleaner",
      name: "Open Chat Cleaner",
      callback: () => this.activateView(CHAT_CLEANER_VIEW_TYPE),
    });

    // 設定タブ
    this.addSettingTab(new VaultAlchemistSettingTab(this.app, this));

    // リボンアイコン
    this.addRibbonIcon("book-open", "Vault Alchemist", () => {
      this.activateView(HOME_VIEW_TYPE);
    });

    console.log("[vault-alchemist] plugin loaded");
  }

  onunload() {
    this.serviceManager.stop();
    console.log("[vault-alchemist] plugin unloaded");
  }

  async loadSettings() {
    this.settings = Object.assign(
      {},
      DEFAULT_SETTINGS,
      await this.loadData()
    );
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  private async activateView(viewType: string): Promise<void> {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(viewType)[0];
    if (!leaf) {
      leaf = workspace.getRightLeaf(false) ?? workspace.getLeaf(true);
      await leaf.setViewState({ type: viewType, active: true });
    }
    workspace.revealLeaf(leaf);
  }
}
