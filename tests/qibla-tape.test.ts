import { describe, expect, it } from "vitest";
import { compassPoint } from "../src/graphics/QiblaTape";

describe("qibla tape", () => {
  it("names the nearest compass point", () => {
    expect(compassPoint(278, "en")).toBe("W");
    expect(compassPoint(295, "en")).toBe("NW");
    expect(compassPoint(-10, "en")).toBe("N");
    expect(compassPoint(278, "bn")).toBe("পশ্চিম");
  });
});
