import type { LLMProvider, GenerateOptions, GenerateResult, EmbedResult } from "@vault-alchemist/shared";

const BASE = "https://api.openai.com/v1";
const CHAT_MODEL = "gpt-4o-mini";
const EMBED_MODEL = "text-embedding-3-small";

// USD per token: [input, output]
const CHAT_COSTS: Record<string, [number, number]> = {
  "gpt-4o-mini": [0.00000015, 0.0000006],
  "gpt-4o": [0.000005, 0.000015],
};

export class OpenAIProvider implements LLMProvider {
  readonly name = "openai" as const;
  constructor(private apiKey: string) {}

  private get headers() {
    return { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" };
  }

  async generate(prompt: string, opts: GenerateOptions = {}): Promise<GenerateResult> {
    const model = opts.model ?? CHAT_MODEL;
    const res = await fetch(`${BASE}/chat/completions`, {
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
    return { text: d.choices[0].message.content, inputTokens: inp, outputTokens: out,
      costUsd: inp * ci + out * co, model: d.model, provider: "openai" };
  }

  async embed(text: string): Promise<EmbedResult> {
    const res = await fetch(`${BASE}/embeddings`, {
      method: "POST", headers: this.headers,
      body: JSON.stringify({ model: EMBED_MODEL, input: text }),
    });
    if (!res.ok) throw new Error(`OpenAI embed: ${res.status} ${await res.text()}`);
    const d = (await res.json()) as { data: { embedding: number[] }[]; usage: { total_tokens: number } };
    const vector = d.data[0].embedding;
    return { vector, dim: vector.length, model: EMBED_MODEL, provider: "openai",
      costUsd: d.usage.total_tokens * 0.00000002 };
  }
}
