import { App, Notice } from "obsidian";
import { spawn, ChildProcess } from "child_process";
import * as path from "path";
import * as fs from "fs";
import type { VaultAlchemistSettings } from "./settings.js";
import type { HealthResponse } from "@vault-alchemist/shared";

const HEALTH_CHECK_INTERVAL_MS = 5000;
const STARTUP_TIMEOUT_MS = 10000;
const FIRST_LAUNCH_KEY = "va_first_launch_done";

export class ServiceManager {
  private proc: ChildProcess | null = null;
  private port: number;
  private healthTimer: ReturnType<typeof setInterval> | null = null;

  constructor(private app: App, private settings: VaultAlchemistSettings) {
    this.port = settings.servicePort;
  }

  async start(): Promise<void> {
    // すでに起動済みなら再起動しない
    const alive = await this.checkHealth();
    if (alive) {
      console.log("[vault-alchemist] service already running");
      return;
    }

    const servicePath = this.resolveServicePath();
    if (!servicePath) {
      console.warn("[vault-alchemist] service binary not found, skipping auto-start");
      return;
    }

    console.log("[vault-alchemist] starting service...");
    this.proc = spawn("node", [servicePath], {
      env: { ...process.env, VA_PORT: String(this.port) },
      detached: false,
      stdio: "ignore",
    });

    this.proc.on("error", (err) => {
      console.error("[vault-alchemist] service process error:", err);
    });

    this.proc.on("exit", (code) => {
      console.log(`[vault-alchemist] service exited with code ${code}`);
      this.proc = null;
    });

    // 起動を待つ
    const ok = await this.waitForHealth(STARTUP_TIMEOUT_MS);
    if (!ok) {
      console.warn("[vault-alchemist] service did not start in time");
      return;
    }

    // 初回起動メッセージ（T008）
    if (!this.settings.firstLaunchDone) {
      new Notice(
        "Vault Alchemistは、あなたのじゃまにならないよう、裏側で静かに動いています 🌙",
        8000
      );
      this.settings.firstLaunchDone = true;
      // settings はプラグイン側で保存される
    }

    // ヘルスウォッチ（クラッシュ時の自動再起動）
    this.healthTimer = setInterval(async () => {
      const alive = await this.checkHealth();
      if (!alive && this.proc === null) {
        console.log("[vault-alchemist] service crash detected, restarting...");
        await this.start();
      }
    }, HEALTH_CHECK_INTERVAL_MS);
  }

  stop(): void {
    if (this.healthTimer) {
      clearInterval(this.healthTimer);
      this.healthTimer = null;
    }
    if (this.proc) {
      this.proc.kill("SIGTERM");
      this.proc = null;
    }
  }

  getBaseUrl(): string {
    return `http://127.0.0.1:${this.port}`;
  }

  private async checkHealth(): Promise<boolean> {
    try {
      const res = await fetch(`${this.getBaseUrl()}/health`, {
        signal: AbortSignal.timeout(2000),
      });
      if (!res.ok) return false;
      const body = (await res.json()) as HealthResponse;
      return body.status === "ok";
    } catch {
      return false;
    }
  }

  private async waitForHealth(timeoutMs: number): Promise<boolean> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      if (await this.checkHealth()) return true;
      await new Promise((r) => setTimeout(r, 500));
    }
    return false;
  }

  private resolveServicePath(): string | null {
    // プラグインフォルダに同梱された service/dist/main.js を探す
    // 開発時はリポジトリルートの service/dist/main.js を使う
    const candidates = [
      path.join(
        (this.app.vault.adapter as any).basePath ?? "",
        ".obsidian/plugins/vault-alchemist/service/dist/main.js"
      ),
      path.resolve(__dirname, "../../service/dist/main.js"),
    ];

    for (const p of candidates) {
      if (fs.existsSync(p)) return p;
    }
    return null;
  }
}
