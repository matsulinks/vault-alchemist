import { describe, it, expect } from "vitest";
import { buildThreads } from "./thread-builder.js";
import { parseChatMarkdown } from "./chat-parser.js";

const CHAT_TWO_TOPICS = `
User: TypeScriptについて教えて
Assistant: TypeScriptはJavaScriptのスーパーセットです。
[2024-01-01 09:00] User: ありがとう、また別件です
[2024-01-01 20:00] User: 全く別の話題：Obsidianのプラグインを作りたい
Assistant: Obsidianプラグインの作り方を説明します。
`.trim();

const CHAT_SINGLE_TOPIC = `
User: Pythonについて教えて
Assistant: Pythonは汎用プログラミング言語です。
User: もっと詳しく
Assistant: Pythonは1991年にGuido van Rossumが作りました。
`.trim();

describe("buildThreads", () => {
  it("時間ギャップがあるチャットを複数スレッドに分割する", () => {
    const msgs = parseChatMarkdown(CHAT_TWO_TOPICS);
    const threads = buildThreads(msgs, "fast");
    expect(threads.length).toBeGreaterThan(1);
  });

  it("分割点がないチャットは1スレッドのまま", () => {
    const msgs = parseChatMarkdown(CHAT_SINGLE_TOPIC);
    const threads = buildThreads(msgs, "fast");
    expect(threads).toHaveLength(1);
    expect(threads[0].messages).toHaveLength(4);
  });

  it("空メッセージ配列で1スレッド（空）を返す", () => {
    const threads = buildThreads([], "fast");
    expect(threads).toHaveLength(1);
    expect(threads[0].messages).toHaveLength(0);
  });

  it("各スレッドに一意の thread_id が付く", () => {
    const msgs = parseChatMarkdown(CHAT_TWO_TOPICS);
    const threads = buildThreads(msgs, "fast");
    const ids = threads.map((t) => t.thread_id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("全メッセージがいずれかのスレッドに含まれる", () => {
    const msgs = parseChatMarkdown(CHAT_TWO_TOPICS);
    const threads = buildThreads(msgs, "fast");
    const total = threads.reduce((sum, t) => sum + t.messages.length, 0);
    expect(total).toBe(msgs.length);
  });

  it("startIndex / endIndex が正しく設定される", () => {
    const msgs = parseChatMarkdown(CHAT_TWO_TOPICS);
    const threads = buildThreads(msgs, "fast");
    for (const t of threads) {
      expect(t.startIndex).toBeLessThanOrEqual(t.endIndex);
    }
    // 最後のスレッドの endIndex は全体の末尾
    const last = threads[threads.length - 1];
    expect(last.endIndex).toBe(msgs.length - 1);
  });
});
