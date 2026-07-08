import type { LLMProvider, ProviderName, GenerateOptions, GenerateResult, EmbedResult } from "@vault-alchemist/shared";

export const DEFAULT_BASE_URL = "https://api.openai.com/v1";
export const DEFAULT_CHAT_MODEL = "gpt-4o-mini";
export const DEFAULT_EMBED_MODEL = "text-embedding-3-small";

// USD per token: [input, output]
const CHAT_COSTS: Record<string, [number, number]> = {
  "gpt-4o-mini": [0.00000015, 0.0000006],
  "gpt-4o": [0.000005, 0.000015],
};

export interface OpenAIProviderOptions {
  /** OpenAI/OAuthのAPIキー。ローカルLLM（Ollama等）で認証不要な場合は省略可 */
  apiKey?: string;
  /** OpenAI互換APIのベースURL。省略時は公式OpenAI APIを使用 */
  baseUrl?: string;
  chatModel?: string;
  embedModel?: string;
}

/**
 * OpenAI互換API向けプロバイダー。
 * baseUrl を差し替えることで Ollama / LM Studio 等のローカルLLM（OpenAI互換API）
 * にもそのまま接続できる（「ローカル優先」方針）。公式OpenAI以外に接続している間は
 * コスト情報が不正確になるため costUsd は常に0とする。
 */
export class OpenAIProvider implements LLMProvider {
  private baseUrl: string;
  private chatModel: string;
  private embedModel: string;
  private apiKey?: string;

  constructor(opts: OpenAIProviderOptions = {}) {
    this.apiKey = opts.apiKey;
    this.baseUrl = opts.baseUrl?.replace(/\/+$/, "") || DEFAULT_BASE_URL;
    this.chatModel = opts.chatModel || DEFAULT_CHAT_MODEL;
    this.embedModel = opts.embedModel || DEFAULT_EMBED_MODEL;
  }

  /** 公式OpenAI API以外（ローカルLLM等）に接続しているか */
  private get isOfficialOpenAI(): boolean {
    return this.baseUrl.includes("api.openai.com");
  }

  get name(): ProviderName {
    return this.isOfficialOpenAI ? "openai" : "local";
  }

  private get headers(): Record<string, string> {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    // ローカルLLM（Ollama等）はAPIキー不要のため未設定なら省略する
    if (this.apiKey) h.Authorization = `Bearer ${this.apiKey}`;
    return h;
  }

  async generate(prompt: string, opts: GenerateOptions = {}): Promise<GenerateResult> {
    const model = opts.model ?? this.chatModel;
    const res = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST", headers: this.headers,
      body: JSON.stringify({
        model, messages: [{ role: "user", content: prompt }],
        max_tokens: opts.maxTokens ?? 1024, temperature: opts.temperature ?? 0.3,
      }),
    });
    if (!res.ok) throw new Error(`OpenAI generate: ${res.status} ${await res.text()}`);
    const d = (await res.json()) as {
      choices: { message: { content: string } }[];
      usage: { prompt_tokens: number; completion_tokens: number };
      model: string;
    };
    const [inp, out] = [d.usage.prompt_tokens, d.usage.completion_tokens];
    const [ci, co] = Object.entries(CHAT_COSTS).find(([k]) => model.includes(k))?.[1] ?? [0, 0];
    // 公式OpenAI以外は課金体系が異なる（無料含む）ためコスト計算しない
    const costUsd = this.isOfficialOpenAI ? inp * ci + out * co : 0;
    return { text: d.choices[0].message.content, inputTokens: inp, outputTokens: out,
      costUsd, model: d.model, provider: this.name };
  }

  async embed(text: string): Promise<EmbedResult> {
    const res = await fetch(`${this.baseUrl}/embeddings`, {
      method: "POST", headers: this.headers,
      body: JSON.stringify({ model: this.embedModel, input: text }),
    });
    if (!res.ok) throw new Error(`OpenAI embed: ${res.status} ${await res.text()}`);
    const d = (await res.json()) as { data: { embedding: number[] }[]; usage: { total_tokens: number } };
    const vector = d.data[0].embedding;
    const costUsd = this.isOfficialOpenAI ? d.usage.total_tokens * 0.00000002 : 0;
    return { vector, dim: vector.length, model: this.embedModel, provider: this.name, costUsd };
  }
}
