import { describe, expect, it } from "vitest";
import { breakable, fitText } from "../src/lib/card-text";

describe("card text", () => {
  it("adds break points only inside very long runs", () => {
    expect(breakable("Eid Mubarak to everyone")).toBe("Eid Mubarak to everyone");
    const long = "k".repeat(40);
    const out = breakable(long)!;
    expect(out.replace(/\u200b/g, "")).toBe(long);
    expect(out.split("\u200b").every((p) => p.length <= 16)).toBe(true);
  });

  it("shrinks long text and clamps its lines", () => {
    expect(fitText("short", 30, 2).fontSize).toBe(30);
    expect(fitText("x".repeat(60), 30, 2).fontSize).toBeCloseTo(30 * Math.sqrt(40 / 60));
    expect(fitText("x".repeat(1000), 30, 2).fontSize).toBe(21);
    expect(fitText("a", 30, 3).WebkitLineClamp).toBe(3);
  });
});
