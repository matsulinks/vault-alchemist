export interface VaultAlchemistSettings {
  servicePort: number;
  openaiApiKey: string;
  authMode: "apikey" | "oauth";
  oauthAccessToken?: string;
  oauthRefreshToken?: string;
  oauthExpiresAt?: number;
  firstLaunchDone: boolean;
  /** OpenAI互換APIのベースURL。空欄なら公式OpenAI APIを使用（ローカルLLM対応: Ollama等） */
  llmBaseUrl: string;
  /** チャット用モデル名。空欄なら既定値（gpt-4o-mini）を使用 */
  llmChatModel: string;
  /** 埋め込み用モデル名。空欄なら既定値（text-embedding-3-small）を使用 */
  llmEmbedModel: string;
}

export const DEFAULT_SETTINGS: VaultAlchemistSettings = {
  servicePort: 3000,
  openaiApiKey: "",
  authMode: "apikey",
  firstLaunchDone: false,
  llmBaseUrl: "",
  llmChatModel: "",
  llmEmbedModel: "",
};
