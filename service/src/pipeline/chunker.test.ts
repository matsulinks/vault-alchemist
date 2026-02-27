import { describe, it, expect } from "vitest";
import { chunkText } from "./chunker.js";

describe("chunkText", () => {
  it("空文字列は空配列を返す", () => {
    expect(chunkText("notes/a.md", "")).toHaveLength(0);
  });

  it("短いテキスト（MIN未満）は空配列を返す", () => {
    expect(chunkText("notes/a.md", "短い")).toHaveLength(0);
  });

  it("1段落は1チャンクになる", () => {
    const text = "これは十分な長さのある1段落のテキストです。テストのために少し長めに書いています。";
    const chunks = chunkText("notes/a.md", text);
    expect(chunks).toHaveLength(1);
    expect(chunks[0].text).toBe(text);
    expect(chunks[0].order).toBe(0);
  });

  it("MAX_CHARS を超えると複数チャンクに分割される", () => {
    const para = "あ".repeat(500);
    const text = `${para}\n\n${para}\n\n${para}`;
    const chunks = chunkText("notes/a.md", text);
    expect(chunks.length).toBeGreaterThan(1);
    for (const c of chunks) {
      expect(c.text.length).toBeLessThanOrEqual(800);
    }
  });

  it("各チャンクに一意の chunkId が割り当てられる", () => {
    const para = "あ".repeat(500);
    const text = `${para}\n\n${para}\n\n${para}`;
    const chunks = chunkText("notes/a.md", text);
    const ids = chunks.map((c) => c.chunkId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("hash は同じテキストなら同じ値になる", () => {
    const text = "同じテキストは同じハッシュになるはずです。テストのために書いています。";
    const c1 = chunkText("notes/a.md", text)[0];
    const c2 = chunkText("notes/a.md", text)[0];
    expect(c1.hash).toBe(c2.hash);
  });

  it("ノートパスがチャンクIDに反映される", () => {
    const text = "これは十分な長さのある1段落のテキストです。テストのために少し長めに書いています。";
    const chunks = chunkText("notes/my-note.md", text);
    expect(chunks[0].chunkId).toContain("my_note_md");
  });
});
