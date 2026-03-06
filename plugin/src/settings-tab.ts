import { App, PluginSettingTab, Setting } from "obsidian";
import type VaultAlchemistPlugin from "./main.js";

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
  }
}
