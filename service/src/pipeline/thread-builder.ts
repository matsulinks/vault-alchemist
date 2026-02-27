import * as crypto from "crypto";
import type { ChatMessage } from "./chat-parser.js";
import { detectBoundariesFast, decideBoundary } from "./boundary-detector.js";
import type { ThreadPreview } from "@vault-alchemist/shared";

export interface Thread {
  thread_id: string;
  messages: ChatMessage[];
  startIndex: number;
  endIndex: number;
  boundaryScore: number;
}

function makeThread(messages: ChatMessage[], start: number, end: number, score: number): Thread {
  return { thread_id: crypto.randomUUID(), messages, startIndex: start, endIndex: end, boundaryScore: score };
}

export function buildThreads(messages: ChatMessage[], _precision: "fast" | "thorough" = "fast"): Thread[] {
  const boundaries = detectBoundariesFast(messages);
  const splitPoints = boundaries
    .filter((b) => decideBoundary(b.score) === "split")
    .map((b) => b.afterIndex)
    .sort((a, b) => a - b);

  const bMap = new Map(boundaries.map((b) => [b.afterIndex, b.score]));
  const threads: Thread[] = [];
  let start = 0;

  for (const at of splitPoints) {
    if (at >= start) {
      threads.push(makeThread(messages.slice(start, at + 1), start, at, bMap.get(at) ?? 1.0));
      start = at + 1;
    }
  }
  threads.push(makeThread(messages.slice(start), start, messages.length - 1, 0));

  return threads.length > 0 ? threads : [makeThread(messages, 0, messages.length - 1, 0)];
}

export function threadToPreview(thread: Thread, title: string, topic: string, summary: string): ThreadPreview {
  return {
    thread_id: thread.thread_id, title, topic, summary,
    messageCount: thread.messages.length,
    startIndex: thread.startIndex, endIndex: thread.endIndex,
    boundaryScore: thread.boundaryScore, riskLevel: "medium",
  };
}

export function threadToMarkdown(thread: Thread, title: string): string {
  const lines = [`# ${title}`, ""];
  for (const msg of thread.messages) {
    const label = msg.role === "user" ? "**User**" : msg.role === "assistant" ? "**Assistant**" : `**${msg.role}**`;
    lines.push(msg.timestamp ? `[${msg.timestamp.toISOString()}] ${label}: ${msg.text}` : `${label}: ${msg.text}`, "");
  }
  return lines.join("\n");
}

export function buildThreadNote(thread: Thread, preview: ThreadPreview): string {
  const summaryLines = preview.summary.split("\n").map((l) => `  ${l}`).join("\n");
  const fm = `---\nsource_type: chat\ntopic: "${preview.topic}"\nsummary: |\n${summaryLines}\n---\n\n`;
  return fm + threadToMarkdown(thread, preview.title);
}

export function buildIndexNote(baseName: string, previews: ThreadPreview[], threadPaths: string[]): string {
  const links = previews.map((p, i) => `- [[${threadPaths[i]}|${p.title}]] — ${p.topic}`).join("\n");
  return `# ${baseName}（分割済み）\n\n> Vault Alchemist によって分割されました。\n\n## スレッド一覧\n\n${links}\n`;
}
