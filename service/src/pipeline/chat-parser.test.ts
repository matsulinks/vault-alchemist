import { describe, it, expect } from "vitest";
import { parseChatMarkdown } from "./chat-parser.js";

describe("parseChatMarkdown", () => {
  it("User:/Assistant: 形式を正しくパースする", () => {
    const md = `
User: こんにちは
Assistant: こんにちは！何かお手伝いできますか？
User: TypeScriptについて教えて
Assistant: TypeScriptはJavaScriptのスーパーセットです。
`.trim();

    const msgs = parseChatMarkdown(md);
    expect(msgs).toHaveLength(4);
    expect(msgs[0].role).toBe("user");
    expect(msgs[0].text).toBe("こんにちは");
    expect(msgs[1].role).toBe("assistant");
    expect(msgs[2].role).toBe("user");
    expect(msgs[3].role).toBe("assistant");
  });

  it("**User:** 形式（太字）を正しくパースする", () => {
    const md = `
**User:** 質問です
**Assistant:** 回答です
`.trim();

    const msgs = parseChatMarkdown(md);
    expect(msgs).toHaveLength(2);
    expect(msgs[0].role).toBe("user");
    expect(msgs[0].text).toBe("質問です");
    expect(msgs[1].role).toBe("assistant");
  });

  it("タイムスタンプ付きフォーマットを正しくパースする", () => {
    const md = `
[2024-01-01 09:00] User: 朝の質問
[2024-01-01 09:01] Assistant: 朝の回答
`.trim();

    const msgs = parseChatMarkdown(md);
    expect(msgs).toHaveLength(2);
    expect(msgs[0].timestamp).toBeInstanceOf(Date);
    expect(msgs[0].timestamp?.getFullYear()).toBe(2024);
    expect(msgs[0].text).toBe("朝の質問");
  });

  it("Human:/AI: 形式を正しくパースする", () => {
    const md = `
Human: 人間の発言
AI: AIの返答
`.trim();

    const msgs = parseChatMarkdown(md);
    expect(msgs).toHaveLength(2);
    expect(msgs[0].role).toBe("user");
    expect(msgs[1].role).toBe("assistant");
  });

  it("複数行の発言をまとめてパースする", () => {
    const md = `
User: 1行目
2行目
3行目
Assistant: 返答
`.trim();

    const msgs = parseChatMarkdown(md);
    expect(msgs).toHaveLength(2);
    expect(msgs[0].text).toContain("1行目");
    expect(msgs[0].text).toContain("2行目");
  });

  it("空文字列を渡すと空配列を返す", () => {
    expect(parseChatMarkdown("")).toHaveLength(0);
  });

  it("msg_id が一意で連番になっている", () => {
    const md = `
User: A
Assistant: B
User: C
`.trim();
    const msgs = parseChatMarkdown(md);
    const ids = msgs.map((m) => m.msg_id);
    expect(ids).toEqual(["msg_1", "msg_2", "msg_3"]);
  });
});
