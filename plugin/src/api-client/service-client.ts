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

  private headers(): Record<string, string> {
    const h: Record<string, string> = {
      "Content-Type": "application/json",
      "x-vault-path": this.vaultPath,
    };
    if (this.openaiKey) h["x-openai-key"] = this.openaiKey;
    return h;
  }

  async health(): Promise<HealthResponse> {
    const res = await fetch(`${this.baseUrl}/health`);
    return res.json() as Promise<HealthResponse>;
  }

  async estimate(notePath: string): Promise<EstimateResponse> {
    const res = await fetch(`${this.baseUrl}/estimate`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({ notePath }),
    });
    return res.json() as Promise<EstimateResponse>;
  }

  async run(req: RunRequest): Promise<RunResponse> {
    const res = await fetch(`${this.baseUrl}/run`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(req),
    });
    if (!res.ok) {
      const err = await res.json() as { error: string };
      throw new Error(err.error);
    }
    return res.json() as Promise<RunResponse>;
  }

  async rollback(run_id: string): Promise<RollbackResponse> {
    const req: RollbackRequest = { run_id };
    const res = await fetch(`${this.baseUrl}/rollback`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(req),
    });
    if (!res.ok) {
      const err = await res.json() as { error: string };
      throw new Error(err.error);
    }
    return res.json() as Promise<RollbackResponse>;
  }
}
