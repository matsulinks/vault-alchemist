import { describe, it, expect, vi, afterEach } from "vitest";
import {
  generatePKCE,
  buildAuthUrl,
  exchangeCodeForTokens,
  refreshOAuthToken,
  getValidToken,
  OAUTH_CLIENT_ID,
  OAUTH_AUTH_URL,
  OAUTH_REDIRECT_URI,
} from "../../../plugin/src/oauth.js";

// NOTE: waitForOAuthCallback と startOAuthFlow は Node.js http サーバーと
// Electron shell に依存するため、統合テストの対象外とする。

describe("generatePKCE", () => {
  it("codeVerifier が base64url 形式で生成される", () => {
    const { codeVerifier } = generatePKCE();
    expect(codeVerifier).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(codeVerifier.length).toBeGreaterThan(0);
  });

  it("codeChallenge が base64url 形式で生成される", () => {
    const { codeChallenge } = generatePKCE();
    expect(codeChallenge).toMatch(/^[A-Za-z0-9_-]+$/);
  });

  it("呼び出しごとに異なる値が生成される", () => {
    const a = generatePKCE();
    const b = generatePKCE();
    expect(a.codeVerifier).not.toBe(b.codeVerifier);
    expect(a.codeChallenge).not.toBe(b.codeChallenge);
  });

  it("codeChallenge は codeVerifier の SHA-256 base64url である", () => {
    const crypto = require("crypto");
    const { codeVerifier, codeChallenge } = generatePKCE();
    const expected = crypto.createHash("sha256").update(codeVerifier).digest("base64url");
    expect(codeChallenge).toBe(expected);
  });
});

describe("buildAuthUrl", () => {
  it("正しいベースURLを持つ", () => {
    const url = buildAuthUrl("challenge123", "state456");
    expect(url.startsWith(OAUTH_AUTH_URL)).toBe(true);
  });

  it("必須パラメーターをすべて含む", () => {
    const url = buildAuthUrl("mychallenge", "mystate");
    const parsed = new URL(url);
    expect(parsed.searchParams.get("response_type")).toBe("code");
    expect(parsed.searchParams.get("client_id")).toBe(OAUTH_CLIENT_ID);
    expect(parsed.searchParams.get("redirect_uri")).toBe(OAUTH_REDIRECT_URI);
    expect(parsed.searchParams.get("code_challenge")).toBe("mychallenge");
    expect(parsed.searchParams.get("code_challenge_method")).toBe("S256");
    expect(parsed.searchParams.get("state")).toBe("mystate");
  });

  it("scope に offline_access が含まれる（リフレッシュトークン取得のため）", () => {
    const url = buildAuthUrl("c", "s");
    const scope = new URL(url).searchParams.get("scope") ?? "";
    expect(scope).toContain("offline_access");
  });

  it("Codex CLI フラグが付与されている", () => {
    const url = buildAuthUrl("c", "s");
    const parsed = new URL(url);
    expect(parsed.searchParams.get("codex_cli_simplified_flow")).toBe("true");
    expect(parsed.searchParams.get("id_token_add_organizations")).toBe("true");
  });
});

describe("exchangeCodeForTokens", () => {
  afterEach(() => vi.restoreAllMocks());

  it("トークンエンドポイントに POST し OAuthTokens を返す", async () => {
    const mockResponse = {
      access_token: "access_abc",
      refresh_token: "refresh_xyz",
      expires_in: 3600,
    };
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => mockResponse,
    } as any);

    const before = Date.now();
    const tokens = await exchangeCodeForTokens("code123", "verifier456");
    const after = Date.now();

    expect(tokens.accessToken).toBe("access_abc");
    expect(tokens.refreshToken).toBe("refresh_xyz");
    expect(tokens.expiresAt).toBeGreaterThanOrEqual(before + 3600 * 1000);
    expect(tokens.expiresAt).toBeLessThanOrEqual(after + 3600 * 1000);

    const [url, opts] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("oauth/token");
    const body = new URLSearchParams(opts.body as string);
    expect(body.get("grant_type")).toBe("authorization_code");
    expect(body.get("code")).toBe("code123");
    expect(body.get("code_verifier")).toBe("verifier456");
  });

  it("レスポンスが失敗なら Error をスローする", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => "Bad Request",
    } as any);

    await expect(exchangeCodeForTokens("bad", "verifier")).rejects.toThrow("Token exchange failed");
  });
});

describe("refreshOAuthToken", () => {
  afterEach(() => vi.restoreAllMocks());

  it("refresh_token で新しいトークンを取得する", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: "new_access",
        refresh_token: "new_refresh",
        expires_in: 7200,
      }),
    } as any);

    const tokens = await refreshOAuthToken("old_refresh");
    expect(tokens.accessToken).toBe("new_access");
    expect(tokens.refreshToken).toBe("new_refresh");
  });
});

describe("getValidToken", () => {
  afterEach(() => vi.restoreAllMocks());

  it("有効期限が十分残っていればそのまま返す", async () => {
    const onRefresh = vi.fn();
    const expiresAt = Date.now() + 60 * 60 * 1000; // 1時間後
    const result = await getValidToken("access", "refresh", expiresAt, onRefresh);
    expect(result).toBe("access");
    expect(onRefresh).not.toHaveBeenCalled();
  });

  it("有効期限5分以内なら自動リフレッシュする", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: "refreshed_access",
        refresh_token: "refreshed_refresh",
        expires_in: 3600,
      }),
    } as any);

    const onRefresh = vi.fn().mockResolvedValue(undefined);
    const expiresAt = Date.now() + 2 * 60 * 1000; // 2分後（5分以内）

    const result = await getValidToken("old_access", "old_refresh", expiresAt, onRefresh);
    expect(result).toBe("refreshed_access");
    expect(onRefresh).toHaveBeenCalledOnce();
    expect(onRefresh.mock.calls[0][0].accessToken).toBe("refreshed_access");
  });

  it("期限切れ済みでもリフレッシュが成功する", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: "new_access",
        refresh_token: "new_refresh",
        expires_in: 3600,
      }),
    } as any);

    const onRefresh = vi.fn().mockResolvedValue(undefined);
    const expiresAt = Date.now() - 1000; // 1秒前に期限切れ

    const result = await getValidToken("expired", "refresh", expiresAt, onRefresh);
    expect(result).toBe("new_access");
  });
});
