import type {
  LLMProvider,
  GenerateOptions,
  GenerateResult,
  EmbedResult,
} from "@vault-alchemist/shared";

const OPENAI_API_BASE = "https://api.openai.com/v1";
const DEFAULT_CHAT_MODEL = "gpt-4o-mini";
const DEFAULT_EMBED_MODEL = "text-embedding-3-small";

export class OpenAIProvider implements LLMProvider {
  readonly name = "openai" as const;

  constructor(private apiKey: string) {}

  async generate(
    prompt: string,
    options: GenerateOptions = {}
  ): Promise<GenerateResult> {
    const model = options.model ?? DEFAULT_CHAT_MODEL;
    const res = await fetch(`${OPENAI_API_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompt }],
        max_tokens: options.maxTokens ?? 1024,
        temperature: options.temperature ?? 0.3,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI generate failed: ${res.status} ${err}`);
    }

    const data = (await res.json()) as {
      choices: { message: { content: string } }[];
      usage: { prompt_tokens: number; completion_tokens: number };
      model: string;
    };

    const inputTokens = data.usage.prompt_tokens;
    const outputTokens = data.usage.completion_tokens;

    return {
      text: data.choices[0].message.content,
      inputTokens,
      outputTokens,
      costUsd: estimateChatCost(model, inputTokens, outputTokens),
      model: data.model,
      provider: "openai",
    };
  }

  async embed(text: string): Promise<EmbedResult> {
    const model = DEFAULT_EMBED_MODEL;
    const res = await fetch(`${OPENAI_API_BASE}/embeddings`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ model, input: text }),
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenAI embed failed: ${res.status} ${err}`);
    }

    const data = (await res.json()) as {
      data: { embedding: number[] }[];
      usage: { total_tokens: number };
    };

    const vector = data.data[0].embedding;
    const tokens = data.usage.total_tokens;

    return {
      vector,
      dim: vector.length,
      model,
      provider: "openai",
      costUsd: estimateEmbedCost(model, tokens),
    };
  }
}

function estimateChatCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  // gpt-4o-mini: $0.15/1M input, $0.60/1M output (2024)
  if (model.includes("gpt-4o-mini")) {
    return (inputTokens * 0.00000015) + (outputTokens * 0.0000006);
  }
  // gpt-4o: $5/1M input, $15/1M output
  if (model.includes("gpt-4o")) {
    return (inputTokens * 0.000005) + (outputTokens * 0.000015);
  }
  return 0;
}

function estimateEmbedCost(model: string, tokens: number): number {
  // text-embedding-3-small: $0.02/1M tokens
  if (model.includes("embedding-3-small")) {
    return tokens * 0.00000002;
  }
  return 0;
}
