import type {
  HealthResponse,
  EstimateResponse,
  RunRequest,
  RunResponse,
  RollbackRequest,
  RollbackResponse,
} from "@vault-alchemist/shared";

export class ServiceClient {
  constructor(
    private baseUrl: string,
    private vaultPath: string,
    private openaiKey?: string
  ) {}

  private get headers(): Record<string, string> {
    const h: Record<string, string> = {
      "Content-Type": "application/json",
      "x-vault-path": this.vaultPath,
    };
    if (this.openaiKey) h["x-openai-key"] = this.openaiKey;
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
}
