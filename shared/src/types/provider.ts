export type ProviderName = "openai" | "xai" | "local";

export interface GenerateOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface GenerateResult {
  text: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  model: string;
  provider: ProviderName;
}

export interface EmbedResult {
  vector: number[];
  dim: number;
  model: string;
  provider: ProviderName;
  costUsd: number;
}

export interface LLMProvider {
  name: ProviderName;
  generate(prompt: string, options?: GenerateOptions): Promise<GenerateResult>;
  embed(text: string): Promise<EmbedResult>;
}

export interface FeatureFlags {
  chat_recompose: boolean;
  semantic_search: boolean;
  graph_layers: boolean;
  xai_explore: boolean;
  local_llm: boolean;
  persona_public: boolean;
}

export const DEFAULT_FEATURE_FLAGS: FeatureFlags = {
  chat_recompose: true,
  semantic_search: false,
  graph_layers: false,
  xai_explore: false,
  local_llm: false,
  persona_public: false,
};
