import { describe, it, expect } from "vitest";
import { exportScale } from "../src/lib/export";

describe("exportScale", () => {
  it("computes the pixel ratio to reach a target width", () => {
    expect(exportScale({ width: 540 }, 1080)).toBeCloseTo(2);
    expect(exportScale({ width: 1080 }, 1080)).toBeCloseTo(1);
  });
});
