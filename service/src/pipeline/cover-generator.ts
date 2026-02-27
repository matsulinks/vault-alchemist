import type { LLMProvider, GenerateResult } from "@vault-alchemist/shared";
import type { Thread } from "./thread-builder.js";

export interface CoverResult {
  topic: string;
  summary: string;
  why_now: string;
  titles: string[];
  costUsd: number;
}

const COVER_PROMPT = (text: string) => `
以下の会話ログを分析してください。

---
${text}
---

以下のJSON形式で応答してください（コードブロック不要、JSONのみ）:
{
  "topic": "1行で主題を説明（例: Obsidianプラグインの設計相談）",
  "summary": "3〜5行で会話の要約。何を話したか・何が決まったか・未解決点はあるか",
  "why_now": "今読む価値を1〜2行で（例: TypeScriptスタック確定の意思決定過程が残っている）",
  "titles": [
    "タイトル案1（思考ログ型: ◯◯の件で◯◯と考えて◯◯やってみた）",
    "タイトル案2（簡潔型: ◯◯について相談）",
    "タイトル案3（結論型: ◯◯で◯◯と決定）"
  ]
}
`.trim();

export async function generateCover(
  thread: Thread,
  provider: LLMProvider
): Promise<CoverResult> {
  const threadText = thread.messages
    .map((m) => `${m.role.toUpperCase()}: ${m.text}`)
    .join("\n\n");

  // 長すぎる場合は先頭+末尾に絞る（トークン節約）
  const truncated =
    threadText.length > 6000
      ? threadText.slice(0, 3000) + "\n...(省略)...\n" + threadText.slice(-2000)
      : threadText;

  const result: GenerateResult = await provider.generate(
    COVER_PROMPT(truncated),
    { maxTokens: 512, temperature: 0.3 }
  );

  let parsed: {
    topic: string;
    summary: string;
    why_now: string;
    titles: string[];
  };

  try {
    parsed = JSON.parse(result.text);
  } catch {
    // パース失敗時はフォールバック
    parsed = {
      topic: "（未分類）",
      summary: result.text.slice(0, 200),
      why_now: "",
      titles: ["会話ログ"],
    };
  }

  return { ...parsed, costUsd: result.costUsd };
}
