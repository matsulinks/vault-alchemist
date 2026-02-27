import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { estimateNote, hashContent } from "./estimator.js";

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "va-est-test-"));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

function writeNote(name: string, content: string): string {
  const p = path.join(tmpDir, name);
  fs.writeFileSync(p, content, "utf-8");
  return p;
}

describe("estimateNote", () => {
  it("単一トピックのチャットは estimatedThreadCount=1", () => {
    const p = writeNote("single.md", `
User: Pythonとは何ですか
Assistant: Pythonは汎用言語です
User: ありがとう
`.trim());

    const result = estimateNote(p);
    expect(result.estimatedThreadCount).toBe(1);
    expect(result.hasPersonalData).toBe(false);
  });

  it("個人情報（メールアドレス）が含まれると hasPersonalData=true", () => {
    const p = writeNote("personal.md", `
User: 私のメールはtest@example.comです
Assistant: 承知しました
`.trim());

    const result = estimateNote(p);
    expect(result.hasPersonalData).toBe(true);
  });

  it("notePath と estimatedDurationSec が正しく返る", () => {
    const p = writeNote("chat.md", `
User: こんにちは
Assistant: こんにちは！
`.trim());

    const result = estimateNote(p);
    expect(result.notePath).toBe(p);
    expect(result.estimatedDurationSec).toBeGreaterThanOrEqual(1);
  });
});

describe("hashContent", () => {
  it("同じ文字列は同じハッシュ", () => {
    expect(hashContent("hello")).toBe(hashContent("hello"));
  });

  it("異なる文字列は異なるハッシュ", () => {
    expect(hashContent("hello")).not.toBe(hashContent("world"));
  });

  it("SHA-256 形式（64文字の16進数）", () => {
    expect(hashContent("test")).toMatch(/^[0-9a-f]{64}$/);
  });
});
