import * as crypto from "crypto";
import type { ChatMessage } from "./chat-parser.js";
import {
  detectBoundariesFast,
  decideBoundary,
  type BoundaryResult,
} from "./boundary-detector.js";
import type { ThreadPreview } from "@vault-alchemist/shared";

export interface Thread {
  thread_id: string;
  messages: ChatMessage[];
  startIndex: number;
  endIndex: number;
  boundaryScore: number;
}

export function buildThreads(
  messages: ChatMessage[],
  precision: "fast" | "thorough" = "fast"
): Thread[] {
  // thorough モードは Phase 2 で埋め込み使用予定。今は fast のみ。
  const boundaries = detectBoundariesFast(messages);

  const splitPoints = new Set<number>();
  for (const b of boundaries) {
    const decision = decideBoundary(b.score);
    if (decision === "split") {
      splitPoints.add(b.afterIndex);
    }
  }

  const boundaryMap = new Map<number, BoundaryResult>(
    boundaries.map((b) => [b.afterIndex, b])
  );

  const threads: Thread[] = [];
  let start = 0;

  const splitArr = [...splitPoints].sort((a, b) => a - b);
  for (const splitAt of splitArr) {
    const slice = messages.slice(start, splitAt + 1);
    if (slice.length > 0) {
      threads.push({
        thread_id: crypto.randomUUID(),
        messages: slice,
        startIndex: start,
        endIndex: splitAt,
        boundaryScore: boundaryMap.get(splitAt)?.score ?? 1.0,
      });
    }
    start = splitAt + 1;
  }

  // 残り
  if (start < messages.length) {
    threads.push({
      thread_id: crypto.randomUUID(),
      messages: messages.slice(start),
      startIndex: start,
      endIndex: messages.length - 1,
      boundaryScore: 0,
    });
  }

  return threads.length > 0 ? threads : [
    {
      thread_id: crypto.randomUUID(),
      messages,
      startIndex: 0,
      endIndex: messages.length - 1,
      boundaryScore: 0,
    },
  ];
}

export function threadToPreview(
  thread: Thread,
  title: string,
  topic: string,
  summary: string
): ThreadPreview {
  return {
    thread_id: thread.thread_id,
    title,
    topic,
    summary,
    messageCount: thread.messages.length,
    startIndex: thread.startIndex,
    endIndex: thread.endIndex,
    boundaryScore: thread.boundaryScore,
    riskLevel: "medium",
  };
}

/** スレッドをMarkdown文字列に変換 */
export function threadToMarkdown(thread: Thread, title: string): string {
  const lines = [`# ${title}`, ""];
  for (const msg of thread.messages) {
    const roleLabel =
      msg.role === "user"
        ? "**User**"
        : msg.role === "assistant"
        ? "**Assistant**"
        : `**${msg.role}**`;
    if (msg.timestamp) {
      lines.push(`[${msg.timestamp.toISOString()}] ${roleLabel}: ${msg.text}`);
    } else {
      lines.push(`${roleLabel}: ${msg.text}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}
