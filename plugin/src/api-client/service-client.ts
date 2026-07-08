import type {
  HealthResponse,
  EstimateResponse,
  RunRequest,
  RunResponse,
  RollbackRequest,
  RollbackResponse,
  RecentRunsResponse,
  EmbedNoteResponse,
  SearchResponse,
  EmbeddedNotesResponse,
} from "@vault-alchemist/shared";

export interface LLMEndpointConfig {
  /** OpenAI互換APIのベースURL（Ollama等のローカルLLM対応）。未設定なら公式OpenAI API */
  baseUrl?: string;
  chatModel?: string;
  embedModel?: string;
}

export class ServiceClient {
  private openaiKey?: string;
  private llmEndpoint: LLMEndpointConfig;

  constructor(
    private baseUrl: string,
    private vaultPath: string,
    openaiKey?: string,
    llmEndpoint?: LLMEndpointConfig
  ) {
    this.openaiKey = openaiKey;
    this.llmEndpoint = llmEndpoint ?? {};
  }

  /** OAuthトークン更新時などに呼ぶ */
  updateApiKey(key: string | undefined): void {
    this.openaiKey = key;
  }

  /** 設定画面でbaseURL/モデル名が変更された際に呼ぶ */
  updateLLMEndpoint(config: LLMEndpointConfig): void {
    this.llmEndpoint = config;
  }

  private get headers(): Record<string, string> {
    const h: Record<string, string> = {
      "Content-Type": "application/json",
      "x-vault-path": this.vaultPath,
    };
    if (this.openaiKey) h["x-openai-key"] = this.openaiKey;
    if (this.llmEndpoint.baseUrl) h["x-llm-base-url"] = this.llmEndpoint.baseUrl;
    if (this.llmEndpoint.chatModel) h["x-llm-chat-model"] = this.llmEndpoint.chatModel;
    if (this.llmEndpoint.embedModel) h["x-llm-embed-model"] = this.llmEndpoint.embedModel;
    return h;
  }

  private async request<T>(method: string, path: string, body?: unknown): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      method,
      headers: this.headers,
      ...(body !== undefined && { body: JSON.stringify(body) }),
    });
    if (!res.ok) throw new Error(((await res.json()) as { error: string }).error);
    return res.json() as Promise<T>;
  }

  health(): Promise<HealthResponse> {
    return fetch(`${this.baseUrl}/health`).then((r) => r.json());
  }

  estimate(notePath: string): Promise<EstimateResponse> {
    return this.request("POST", "/estimate", { notePath });
  }

  run(req: RunRequest): Promise<RunResponse> {
    return this.request("POST", "/run", req);
  }

  rollback(run_id: string): Promise<RollbackResponse> {
    return this.request<RollbackResponse>("POST", "/rollback", { run_id } as RollbackRequest);
  }

  recentRuns(sinceHours = 24): Promise<RecentRunsResponse> {
    return this.request<RecentRunsResponse>("GET", `/recent-runs?since_hours=${sinceHours}`);
  }

  embed(notePath: string): Promise<EmbedNoteResponse> {
    return this.request<EmbedNoteResponse>("POST", "/embed", { notePath });
  }

  search(query: string, topK = 5): Promise<SearchResponse> {
    return this.request<SearchResponse>("GET", `/search?q=${encodeURIComponent(query)}&top_k=${topK}`);
  }

  embeddedNotes(): Promise<EmbeddedNotesResponse> {
    return this.request<EmbeddedNotesResponse>("GET", "/embedded-notes");
  }
}
