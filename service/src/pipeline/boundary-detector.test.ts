import { describe, it, expect } from "vitest";
import {
  detectBoundariesFast,
  decideBoundary,
} from "./boundary-detector.js";
import type { ChatMessage } from "./chat-parser.js";

function makeMsg(
  overrides: Partial<ChatMessage> & { text: string }
): ChatMessage {
  return {
    msg_id: "msg_1",
    role: "user",
    timestamp: null,
    lineIndex: 0,
    ...overrides,
  };
}

describe("decideBoundary", () => {
  it("スコア >= 0.7 は split", () => {
    expect(decideBoundary(0.7)).toBe("split");
    expect(decideBoundary(1.0)).toBe("split");
  });

  it("スコア 0.4〜0.7 未満は candidate", () => {
    expect(decideBoundary(0.4)).toBe("candidate");
    expect(decideBoundary(0.69)).toBe("candidate");
  });

  it("スコア < 0.4 は continue", () => {
    expect(decideBoundary(0.0)).toBe("continue");
    expect(decideBoundary(0.39)).toBe("continue");
  });
});

describe("detectBoundariesFast", () => {
  it("時間ギャップ 6時間以上でスコア +0.4", () => {
    const msgs: ChatMessage[] = [
      makeMsg({ msg_id: "1", text: "朝の話", timestamp: new Date("2024-01-01T09:00:00Z") }),
      makeMsg({ msg_id: "2", text: "夜の話", timestamp: new Date("2024-01-01T17:00:00Z") }),
    ];
    const results = detectBoundariesFast(msgs);
    expect(results).toHaveLength(1);
    expect(results[0].afterIndex).toBe(0);
    expect(results[0].score).toBeCloseTo(0.4);
    expect(results[0].reasons[0]).toMatch(/time gap/);
  });

  it("話題転換語でスコア +0.3", () => {
    const msgs: ChatMessage[] = [
      makeMsg({ msg_id: "1", text: "前の話" }),
      makeMsg({ msg_id: "2", text: "別件で聞きたいんですけど" }),
    ];
    const results = detectBoundariesFast(msgs);
    expect(results).toHaveLength(1);
    expect(results[0].score).toBeCloseTo(0.3);
    expect(results[0].reasons[0]).toMatch(/transition word/i);
  });

  it("明示的終了宣言でスコア +0.6", () => {
    const msgs: ChatMessage[] = [
      makeMsg({ msg_id: "1", text: "ありがとう、以上です" }),
      makeMsg({ msg_id: "2", text: "新しいトピック" }),
    ];
    const results = detectBoundariesFast(msgs);
    expect(results).toHaveLength(1);
    expect(results[0].score).toBeGreaterThanOrEqual(0.6);
  });

  it("スコアが累積する（時間ギャップ + 終了宣言で分割確定）", () => {
    const msgs: ChatMessage[] = [
      makeMsg({
        msg_id: "1",
        text: "今日はここまで",
        timestamp: new Date("2024-01-01T09:00:00Z"),
      }),
      makeMsg({
        msg_id: "2",
        text: "新しい話",
        timestamp: new Date("2024-01-01T20:00:00Z"),
      }),
    ];
    const results = detectBoundariesFast(msgs);
    expect(results[0].score).toBeGreaterThanOrEqual(0.7); // split 確定
  });

  it("関係ない発言が続いても境界は出ない", () => {
    const msgs: ChatMessage[] = [
      makeMsg({ msg_id: "1", text: "続きの話" }),
      makeMsg({ msg_id: "2", text: "その続き" }),
      makeMsg({ msg_id: "3", text: "さらに続き" }),
    ];
    const results = detectBoundariesFast(msgs);
    expect(results).toHaveLength(0);
  });
});
