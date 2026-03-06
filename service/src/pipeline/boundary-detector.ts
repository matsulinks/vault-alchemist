import type { ChatMessage } from "./chat-parser.js";

export interface BoundaryResult {
  afterIndex: number;
  score: number;
  reasons: string[];
}

const TRANSITION_WORDS = [
  "次は",
  "別件",
  "話変わって",
  "ところで",
  "by the way",
  "anyway",
  "moving on",
  "next topic",
  "次のテーマ",
  "別の話",
];

const END_DECLARATIONS = [
  "以上",
  "ありがとう",
  "thank you",
  "that's all",
  "done for today",
  "今日はここまで",
  "終わり",
];

const TIME_GAP_HOURS = 6;

/** 「速い（粗め）」境界検出 — LLM不使用 */
export function detectBoundariesFast(
  messages: ChatMessage[]
): BoundaryResult[] {
  const boundaries: BoundaryResult[] = [];

  for (let i = 0; i < messages.length - 1; i++) {
    const cur = messages[i];
    const next = messages[i + 1];
    let score = 0;
    const reasons: string[] = [];

    // 1) 時間ギャップ（6時間以上）
    if (cur.timestamp && next.timestamp) {
      const gapHours =
        (next.timestamp.getTime() - cur.timestamp.getTime()) / (1000 * 3600);
      if (gapHours >= TIME_GAP_HOURS) {
        score += 0.4;
        reasons.push(`time gap: ${gapHours.toFixed(1)}h`);
      }
    }

    // 2) 話題転換語
    const nextText = next.text.toLowerCase();
    for (const word of TRANSITION_WORDS) {
      if (nextText.startsWith(word.toLowerCase())) {
        score += 0.3;
        reasons.push(`transition word: "${word}"`);
        break;
      }
    }

    // 3) 明示的終了宣言
    const curText = cur.text.toLowerCase();
    for (const decl of END_DECLARATIONS) {
      if (curText.includes(decl.toLowerCase())) {
        score += 0.6;
        reasons.push(`end declaration: "${decl}"`);
        break;
      }
    }

    if (score > 0) {
      boundaries.push({ afterIndex: i, score, reasons });
    }
  }

  return boundaries;
}

export type BoundaryDecision = "split" | "candidate" | "continue";

export function decideBoundary(score: number): BoundaryDecision {
  if (score >= 0.7) return "split";
  if (score >= 0.4) return "candidate";
  return "continue";
}
