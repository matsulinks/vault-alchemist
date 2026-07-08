import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { atomicWriteFileSync } from "./atomic-file.js";

// fs.renameSync を一部のテストだけ差し替えるため、実体を保ったままモック化する
// （`import * as fs` の名前空間は ESM 上 spyOn できないため vi.mock を使う）
vi.mock("fs", async (importOriginal) => {
  const actual = await importOriginal<typeof import("fs")>();
  return { ...actual, renameSync: vi.fn(actual.renameSync) };
});

let tmpDir: string;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "va-atomic-test-"));
});

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe("atomicWriteFileSync", () => {
  it("正常系: ファイルが指定内容で作成される", () => {
    const target = path.join(tmpDir, "note.md");
    atomicWriteFileSync(target, "hello world");

    expect(fs.readFileSync(target, "utf-8")).toBe("hello world");
  });

  it("正常系: 既存ファイルを上書きできる", () => {
    const target = path.join(tmpDir, "note.md");
    fs.writeFileSync(target, "old content", "utf-8");

    atomicWriteFileSync(target, "new content");

    expect(fs.readFileSync(target, "utf-8")).toBe("new content");
  });

  it("正常系: 書き込み後に一時ファイルが残らない", () => {
    const target = path.join(tmpDir, "note.md");
    atomicWriteFileSync(target, "content");

    const leftovers = fs.readdirSync(tmpDir).filter((f) => f.includes(".tmp-"));
    expect(leftovers).toHaveLength(0);
  });

  it("異常系: rename失敗時に元ファイルが無傷で、一時ファイルも掃除される", () => {
    const target = path.join(tmpDir, "note.md");
    fs.writeFileSync(target, "original content", "utf-8");

    (fs.renameSync as unknown as ReturnType<typeof vi.fn>).mockImplementationOnce(() => {
      throw new Error("simulated rename failure");
    });

    expect(() => atomicWriteFileSync(target, "new content")).toThrow("simulated rename failure");

    // 元ファイルの内容は変わっていない
    expect(fs.readFileSync(target, "utf-8")).toBe("original content");

    // 一時ファイルが残っていない
    const leftovers = fs.readdirSync(tmpDir).filter((f) => f.includes(".tmp-"));
    expect(leftovers).toHaveLength(0);
  });

  it("異常系: 書き込み自体が失敗しても例外がそのまま伝播する", () => {
    const target = path.join(tmpDir, "nonexistent-dir", "note.md");

    expect(() => atomicWriteFileSync(target, "content")).toThrow();
  });
});
