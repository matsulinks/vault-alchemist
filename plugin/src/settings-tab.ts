import { App, Notice, PluginSettingTab, Setting } from "obsidian";
import type VaultAlchemistPlugin from "./main.js";
import { startOAuthFlow } from "./oauth.js";

export class VaultAlchemistSettingTab extends PluginSettingTab {
  private plugin: VaultAlchemistPlugin;

  constructor(app: App, plugin: VaultAlchemistPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "Vault Alchemist" });

    // 認証モード選択
    new Setting(containerEl)
      .setName("認証方法")
      .setDesc("APIキーを直接入力するか、ChatGPT Plus / Max のアカウントで連携するかを選択します。")
      .addDropdown((drop) =>
        drop
          .addOption("apikey", "APIキー")
          .addOption("oauth", "ChatGPT Plus / Max（OAuth）")
          .setValue(this.plugin.settings.authMode)
          .onChange(async (value) => {
            this.plugin.settings.authMode = value as "apikey" | "oauth";
            await this.plugin.saveSettings();
            this.display(); // 再描画
          })
      );

    if (this.plugin.settings.authMode === "apikey") {
      new Setting(containerEl)
        .setName("OpenAI API Key")
        .setDesc("sk-... の形式で入力してください。設定後に再起動不要です。")
        .addText((text) =>
          text
            .setPlaceholder("sk-...")
            .setValue(this.plugin.settings.openaiApiKey)
            .onChange(async (value) => {
              this.plugin.settings.openaiApiKey = value.trim();
              await this.plugin.saveSettings();
            })
        );
    } else {
      const isConnected = !!this.plugin.settings.oauthAccessToken;
      const statusText = isConnected ? "✓ 連携済み" : "未連携";

      new Setting(containerEl)
        .setName("ChatGPT Plus / Max 連携")
        .setDesc(
          isConnected
            ? "ChatGPT Plus / Max アカウントと連携済みです。"
            : "ボタンを押してブラウザでログインしてください。ChatGPT Plus / Max のサブスクリプションが必要です。"
        )
        .addButton((btn) => {
          btn
            .setButtonText(isConnected ? "再連携" : "ChatGPT でログイン")
            .setCta()
            .onClick(async () => {
              btn.setButtonText("ブラウザを開いています...").setDisabled(true);
              try {
                const tokens = await startOAuthFlow();
                this.plugin.settings.oauthAccessToken = tokens.accessToken;
                this.plugin.settings.oauthRefreshToken = tokens.refreshToken;
                this.plugin.settings.oauthExpiresAt = tokens.expiresAt;
                await this.plugin.saveSettings();
                this.plugin.updateApiKey(tokens.accessToken);
                new Notice("✓ ChatGPT Plus / Max と連携しました");
                this.display();
              } catch (e: any) {
                new Notice(`連携失敗: ${e.message}`);
                btn.setButtonText("ChatGPT でログイン").setDisabled(false);
              }
            });
        })
        .addExtraButton((btn) => {
          btn
            .setIcon(isConnected ? "check-circle" : "alert-circle")
            .setTooltip(statusText);
        });

      if (isConnected) {
        new Setting(containerEl)
          .setName("連携を解除")
          .setDesc("OAuthトークンを削除してAPIキーモードに戻します。")
          .addButton((btn) =>
            btn
              .setButtonText("解除")
              .setWarning()
              .onClick(async () => {
                this.plugin.settings.oauthAccessToken = undefined;
                this.plugin.settings.oauthRefreshToken = undefined;
                this.plugin.settings.oauthExpiresAt = undefined;
                this.plugin.settings.authMode = "apikey";
                await this.plugin.saveSettings();
                this.plugin.updateApiKey(undefined);
                this.display();
              })
          );
      }
    }

    new Setting(containerEl)
      .setName("Service Port")
      .setDesc("バックグラウンドサービスのポート番号（デフォルト: 3000）")
      .addText((text) =>
        text
          .setPlaceholder("3000")
          .setValue(String(this.plugin.settings.servicePort))
          .onChange(async (value) => {
            const port = parseInt(value, 10);
            if (!isNaN(port) && port > 0 && port < 65536) {
              this.plugin.settings.servicePort = port;
              await this.plugin.saveSettings();
            }
          })
      );

    containerEl.createEl("h2", { text: "ローカル / カスタムLLM（上級者向け）" });
    containerEl.createEl("p", {
      text:
        "Ollama / LM Studio 等、Mac mini上で動くOpenAI互換APIに接続できます。" +
        "Base URLを空欄のままにすると、これまで通り公式OpenAI APIを使用します（挙動は変わりません）。",
      cls: "setting-item-description",
    });

    new Setting(containerEl)
      .setName("Base URL")
      .setDesc("OpenAI互換APIのエンドポイント（例: http://localhost:11434/v1）。ローカルLLMはAPIキー不要です。")
      .addText((text) =>
        text
          .setPlaceholder("https://api.openai.com/v1")
          .setValue(this.plugin.settings.llmBaseUrl)
          .onChange(async (value) => {
            this.plugin.settings.llmBaseUrl = value.trim();
            await this.plugin.saveSettings();
            this.plugin.updateLLMEndpoint();
          })
      );

    new Setting(containerEl)
      .setName("チャットモデル名")
      .setDesc("空欄の場合は既定値（gpt-4o-mini）を使用します。")
      .addText((text) =>
        text
          .setPlaceholder("gpt-4o-mini")
          .setValue(this.plugin.settings.llmChatModel)
          .onChange(async (value) => {
            this.plugin.settings.llmChatModel = value.trim();
            await this.plugin.saveSettings();
            this.plugin.updateLLMEndpoint();
          })
      );

    new Setting(containerEl)
      .setName("埋め込みモデル名")
      .setDesc(
        "空欄の場合は既定値（text-embedding-3-small）を使用します。" +
          "既存の埋め込みと異なるモデルに変更すると、意味検索実行時にエラーになります（要再埋め込み）。"
      )
      .addText((text) =>
        text
          .setPlaceholder("text-embedding-3-small")
          .setValue(this.plugin.settings.llmEmbedModel)
          .onChange(async (value) => {
            this.plugin.settings.llmEmbedModel = value.trim();
            await this.plugin.saveSettings();
            this.plugin.updateLLMEndpoint();
          })
      );
  }
}
