import { Plugin, Notice, WorkspaceLeaf } from "obsidian";
import * as fs from "fs";
import * as path from "path";
import { ServiceManager } from "./service-manager.js";
import { ServiceClient } from "./api-client/service-client.js";
import { VaultAlchemistSettings, DEFAULT_SETTINGS } from "./settings.js";
import { VaultAlchemistSettingTab } from "./settings-tab.js";
import { getValidToken } from "@vault-alchemist/shared";
import { reportError } from "./error-reporter.js";
import {
  ChatCleanerView,
  CHAT_CLEANER_VIEW_TYPE,
} from "./views/chat-cleaner-view.js";
import { HomeView, HOME_VIEW_TYPE } from "./views/home-view.js";
import { SearchView, SEARCH_VIEW_TYPE } from "./views/search-view.js";

export default class VaultAlchemistPlugin extends Plugin {
  settings!: VaultAlchemistSettings;
  private serviceManager!: ServiceManager;
  private client!: ServiceClient;

  async onload() {
    try {
      await this._init();
    } catch (e) {
      reportError("onload", e);
      throw e; // Obsidian にもエラーを伝える
    }
  }

  private async _init() {
    await this.loadSettings();

    this.serviceManager = new ServiceManager(this.app, this.settings);
    await this.serviceManager.start();
    await this.saveSettings(); // firstLaunchDone の保存

    const vaultPath =
      (this.app.vault.adapter as any).basePath ?? "";

    const initialKey = await this.resolveApiKey();
    this.client = new ServiceClient(
      this.serviceManager.getBaseUrl(),
      vaultPath,
      initialKey
    );

    // ビューの登録
    this.registerView(HOME_VIEW_TYPE, (leaf: WorkspaceLeaf) => {
      return new HomeView(leaf, this.client);
    });
    this.registerView(CHAT_CLEANER_VIEW_TYPE, (leaf: WorkspaceLeaf) => {
      return new ChatCleanerView(leaf, this.client, vaultPath);
    });
    this.registerView(SEARCH_VIEW_TYPE, (leaf: WorkspaceLeaf) => {
      return new SearchView(leaf, this.client);
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

    this.addCommand({
      id: "open-search",
      name: "Open Semantic Search",
      callback: () => this.activateView(SEARCH_VIEW_TYPE),
    });

    // 設定タブ
    this.addSettingTab(new VaultAlchemistSettingTab(this.app, this));

    // リボンアイコン
    this.addRibbonIcon("book-open", "Vault Alchemist", () => {
      this.activateView(HOME_VIEW_TYPE);
    });

    // 初回起動時: 設定画面を自動で開く
    if (!this.settings.firstLaunchDone) {
      this.settings.firstLaunchDone = true;
      await this.saveSettings();
      // レイアウト準備後に設定を開く
      this.app.workspace.onLayoutReady(() => {
        // @ts-ignore
        this.app.setting.open();
        // @ts-ignore
        this.app.setting.openTabById("vault-alchemist");
      });
    }

    // インストーラーからの更新を検知して自動リロード
    this.startUpdateWatcher();

    console.log("[vault-alchemist] plugin loaded");
  }

  onunload() {
    this.serviceManager?.stop();
    console.log("[vault-alchemist] plugin unloaded");
  }

  /** 現在の設定から有効なAPIキー（またはOAuthトークン）を返す */
  async resolveApiKey(): Promise<string | undefined> {
    if (this.settings.authMode === "oauth") {
      const { oauthAccessToken, oauthRefreshToken, oauthExpiresAt } = this.settings;
      if (!oauthAccessToken || !oauthRefreshToken || !oauthExpiresAt) return undefined;
      return getValidToken(oauthAccessToken, oauthRefreshToken, oauthExpiresAt, async (tokens) => {
        this.settings.oauthAccessToken = tokens.accessToken;
        this.settings.oauthRefreshToken = tokens.refreshToken;
        this.settings.oauthExpiresAt = tokens.expiresAt;
        await this.saveSettings();
        this.client.updateApiKey(tokens.accessToken);
      });
    }
    return this.settings.openaiApiKey || undefined;
  }

  /** settings-tab から呼ばれる: ServiceClient のキーをその場で更新する */
  updateApiKey(key: string | undefined): void {
    this.client.updateApiKey(key);
  }

  private startUpdateWatcher(): void {
    const pluginDir = path.join(
      (this.app.vault.adapter as any).basePath ?? "",
      ".obsidian/plugins/vault-alchemist"
    );
    const sentinel = path.join(pluginDir, ".updated");

    const timer = setInterval(async () => {
      if (!fs.existsSync(sentinel)) return;
      try { fs.unlinkSync(sentinel); } catch { /* ignore */ }
      // @ts-ignore
      await this.app.plugins.reloadPlugin("vault-alchemist");
    }, 3000);

    this.register(() => clearInterval(timer));
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
