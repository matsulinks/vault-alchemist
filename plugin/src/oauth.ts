import * as http from "http";
import * as crypto from "crypto";
import {
  generatePKCE,
  buildAuthUrl,
  exchangeCodeForTokens,
  type OAuthTokens,
} from "@vault-alchemist/shared";

const CALLBACK_PORT = 1455;

function callbackHtml(type: "success" | "error", heading: string, body: string): string {
  const isSuccess = type === "success";
  const icon = isSuccess ? "✓" : "✕";
  const accentColor = isSuccess ? "#4caf82" : "#e05c5c";
  const bgColor = isSuccess ? "#f0faf4" : "#fdf2f2";

  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vault Alchemist</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      background: ${bgColor};
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      color: #1a1a1a;
    }
    .card {
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
      padding: 48px 56px;
      text-align: center;
      max-width: 400px;
      width: 90%;
    }
    .icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: ${accentColor};
      color: #fff;
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 24px;
    }
    .app-name {
      font-size: 13px;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: #888;
      margin-bottom: 12px;
    }
    h1 {
      font-size: 22px;
      font-weight: 700;
      margin-bottom: 12px;
      color: #111;
    }
    p {
      font-size: 15px;
      color: #555;
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${icon}</div>
    <div class="app-name">Vault Alchemist</div>
    <h1>${heading}</h1>
    <p>${body}</p>
  </div>
</body>
</html>`;
}

export function waitForOAuthCallback(expectedState: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url!, `http://localhost:${CALLBACK_PORT}`);

      if (url.pathname !== "/auth/callback") {
        res.writeHead(404);
        res.end();
        return;
      }

      const code = url.searchParams.get("code");
      const state = url.searchParams.get("state");
      const error = url.searchParams.get("error");

      if (error) {
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(callbackHtml("error", `認証エラーが発生しました`, `エラーコード: ${error}`));
        server.close();
        reject(new Error(`OAuth error: ${error}`));
        return;
      }

      if (!code || state !== expectedState) {
        res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
        res.end(callbackHtml("error", "無効なリクエストです", "このタブを閉じて、Obsidian からやり直してください。"));
        server.close();
        reject(new Error("Invalid OAuth callback"));
        return;
      }

      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(callbackHtml("success", "Vault Alchemist と連携しました", "このタブを閉じて、Obsidian に戻ってください。"));
      server.close();
      resolve(code);
    });

    server.on("error", reject);
    server.listen(CALLBACK_PORT, "127.0.0.1");

    const timeout = setTimeout(() => {
      server.close();
      reject(new Error("OAuth timeout (5分)"));
    }, 5 * 60 * 1000);

    server.on("close", () => clearTimeout(timeout));
  });
}

/** ブラウザを開いてOAuth認証フローを開始する */
export async function startOAuthFlow(): Promise<OAuthTokens> {
  const { codeVerifier, codeChallenge } = generatePKCE();
  const state = crypto.randomBytes(16).toString("base64url");
  const authUrl = buildAuthUrl(codeChallenge, state);

  // Electron環境でシステムブラウザを開く
  const { shell } = require("electron") as { shell: { openExternal: (url: string) => Promise<void> } };
  await shell.openExternal(authUrl);

  const code = await waitForOAuthCallback(state);
  return exchangeCodeForTokens(code, codeVerifier);
}
