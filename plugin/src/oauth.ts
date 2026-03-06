import * as http from "http";
import * as crypto from "crypto";

export const OAUTH_CLIENT_ID = "app_EMoamEEZ73f0CkXaXp7hrann";
export const OAUTH_AUTH_URL = "https://auth.openai.com/oauth/authorize";
export const OAUTH_TOKEN_URL = "https://auth.openai.com/oauth/token";
export const OAUTH_REDIRECT_URI = "http://localhost:1455/auth/callback";
const OAUTH_SCOPES = "openid profile email offline_access";
const CALLBACK_PORT = 1455;

export interface OAuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export function generatePKCE(): { codeVerifier: string; codeChallenge: string } {
  const bytes = crypto.randomBytes(32);
  const codeVerifier = bytes.toString("base64url");
  const hash = crypto.createHash("sha256").update(codeVerifier).digest();
  const codeChallenge = hash.toString("base64url");
  return { codeVerifier, codeChallenge };
}

export function buildAuthUrl(codeChallenge: string, state: string): string {
  const params = new URLSearchParams({
    response_type: "code",
    client_id: OAUTH_CLIENT_ID,
    redirect_uri: OAUTH_REDIRECT_URI,
    scope: OAUTH_SCOPES,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    id_token_add_organizations: "true",
    codex_cli_simplified_flow: "true",
    state,
  });
  return `${OAUTH_AUTH_URL}?${params}`;
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
        res.end(`<html><body><p>認証エラー: ${error}</p><p>このタブを閉じてください。</p></body></html>`);
        server.close();
        reject(new Error(`OAuth error: ${error}`));
        return;
      }

      if (!code || state !== expectedState) {
        res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
        res.end("<html><body><p>無効なリクエストです。</p></body></html>");
        server.close();
        reject(new Error("Invalid OAuth callback"));
        return;
      }

      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end("<html><body><h2>✓ 連携完了</h2><p>このタブを閉じてください。</p></body></html>");
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

export async function exchangeCodeForTokens(code: string, codeVerifier: string): Promise<OAuthTokens> {
  const res = await fetch(OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: OAUTH_REDIRECT_URI,
      client_id: OAUTH_CLIENT_ID,
      code_verifier: codeVerifier,
    }),
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${res.status} ${await res.text()}`);
  const d = await res.json() as { access_token: string; refresh_token: string; expires_in: number };
  return {
    accessToken: d.access_token,
    refreshToken: d.refresh_token,
    expiresAt: Date.now() + d.expires_in * 1000,
  };
}

export async function refreshOAuthToken(refreshToken: string): Promise<OAuthTokens> {
  const res = await fetch(OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: OAUTH_CLIENT_ID,
    }),
  });
  if (!res.ok) throw new Error(`Token refresh failed: ${res.status} ${await res.text()}`);
  const d = await res.json() as { access_token: string; refresh_token: string; expires_in: number };
  return {
    accessToken: d.access_token,
    refreshToken: d.refresh_token,
    expiresAt: Date.now() + d.expires_in * 1000,
  };
}

/** 有効期限5分前に自動リフレッシュ。onRefresh でsettingsに保存すること。 */
export async function getValidToken(
  accessToken: string,
  refreshToken: string,
  expiresAt: number,
  onRefresh: (tokens: OAuthTokens) => Promise<void>
): Promise<string> {
  if (Date.now() > expiresAt - 5 * 60 * 1000) {
    const tokens = await refreshOAuthToken(refreshToken);
    await onRefresh(tokens);
    return tokens.accessToken;
  }
  return accessToken;
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
