import { describe, it, expect } from "vitest";
import { cosineSimilarity } from "./similarity.js";

describe("cosineSimilarity", () => {
  it("同一ベクトルは 1.0 を返す", () => {
    expect(cosineSimilarity([1, 2, 3], [1, 2, 3])).toBeCloseTo(1.0);
  });

  it("直交ベクトルは 0 を返す", () => {
    expect(cosineSimilarity([1, 0, 0], [0, 1, 0])).toBeCloseTo(0.0);
  });

  it("逆方向ベクトルは -1.0 を返す", () => {
    expect(cosineSimilarity([1, 0], [-1, 0])).toBeCloseTo(-1.0);
  });

  it("正規化済みでないベクトルでもスコアが [0, 1] に収まる（同方向）", () => {
    const a = [3, 4];
    const b = [6, 8];
    expect(cosineSimilarity(a, b)).toBeCloseTo(1.0);
  });

  it("ゼロベクトルは 0 を返す（ゼロ除算を起こさない）", () => {
    expect(cosineSimilarity([0, 0, 0], [1, 2, 3])).toBe(0);
  });

  it("一般的なベクトルでスコアが計算される", () => {
    const score = cosineSimilarity([1, 1], [1, 0]);
    expect(score).toBeCloseTo(Math.SQRT1_2);
  });
});
