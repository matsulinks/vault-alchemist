import * as fs from "fs";
import * as crypto from "crypto";
import { parseChatMarkdown } from "./chat-parser.js";
import { buildThreads } from "./thread-builder.js";
import type { EstimateResponse } from "@vault-alchemist/shared";

// GPT-4o-mini: ~0.15s per thread (cover gen). rough.
const SEC_PER_THREAD = 0.5;

export function estimateNote(notePath: string): EstimateResponse {
  const content = fs.readFileSync(notePath, "utf-8");
  const messages = parseChatMarkdown(content);
  const threads = buildThreads(messages, "fast");

  const estimatedThreadCount = threads.length;
  const estimatedDurationSec = Math.ceil(estimatedThreadCount * SEC_PER_THREAD);

  // 個人情報の簡易検出（メール・電話・実名パターン）
  const personalPatterns = [
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/,
    /\b\d{3}[-.\s]?\d{4}[-.\s]?\d{4}\b/,
  ];
  const hasPersonalData = personalPatterns.some((p) => p.test(content));

  return {
    notePath,
    estimatedThreadCount,
    estimatedDurationSec,
    riskBreakdown: {
      low: 0,
      medium: estimatedThreadCount,
      high: 0,
    },
    hasPersonalData,
  };
}

export function hashContent(content: string): string {
  return crypto.createHash("sha256").update(content).digest("hex");
}
