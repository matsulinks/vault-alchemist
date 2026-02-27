import { App, Notice } from "obsidian";
import { spawn, ChildProcess } from "child_process";
import * as path from "path";
import * as fs from "fs";
import type { VaultAlchemistSettings } from "./settings.js";

export class ServiceManager {
  private proc: ChildProcess | null = null;
  private healthTimer: ReturnType<typeof setInterval> | null = null;
  private port: number;

  constructor(private app: App, private settings: VaultAlchemistSettings) {
    this.port = settings.servicePort;
  }

  async start(): Promise<void> {
    if (await this.isAlive()) return;

    const bin = this.findBin();
    if (!bin) return;

    this.proc = spawn("node", [bin], {
      env: { ...process.env, VA_PORT: String(this.port) },
      stdio: "ignore",
    });
    this.proc.on("error", (e) => console.error("[va] service error:", e));
    this.proc.on("exit", () => { this.proc = null; });

    if (!await this.waitAlive(10000)) return;

    if (!this.settings.firstLaunchDone) {
      new Notice("Vault Alchemistは、あなたのじゃまにならないよう、裏側で静かに動いています 🌙", 8000);
      this.settings.firstLaunchDone = true;
    }

    this.healthTimer = setInterval(async () => {
      if (!await this.isAlive() && !this.proc) this.start();
    }, 5000);
  }

  stop(): void {
    if (this.healthTimer) { clearInterval(this.healthTimer); this.healthTimer = null; }
    if (this.proc) { this.proc.kill("SIGTERM"); this.proc = null; }
  }

  getBaseUrl(): string {
    return `http://127.0.0.1:${this.port}`;
  }

  private async isAlive(): Promise<boolean> {
    try {
      const res = await fetch(`${this.getBaseUrl()}/health`, { signal: AbortSignal.timeout(2000) });
      return res.ok && (await res.json() as any).status === "ok";
    } catch { return false; }
  }

  private async waitAlive(ms: number): Promise<boolean> {
    const end = Date.now() + ms;
    while (Date.now() < end) {
      if (await this.isAlive()) return true;
      await new Promise((r) => setTimeout(r, 500));
    }
    return false;
  }

  private findBin(): string | null {
    const vaultBase = (this.app.vault.adapter as any).basePath ?? "";
    const candidates = [
      path.join(vaultBase, ".obsidian/plugins/vault-alchemist/service/dist/main.js"),
      path.resolve(__dirname, "../../service/dist/main.js"),
    ];
    return candidates.find((p) => fs.existsSync(p)) ?? null;
  }
}
