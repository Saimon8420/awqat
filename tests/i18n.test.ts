import { describe, it, expect } from "vitest";
import { label, toNumerals, dir } from "../src/lib/i18n";

describe("i18n", () => {
  it("returns localized prayer labels", () => {
    expect(label("fajr", "en")).toBe("Fajr");
    expect(label("fajr", "bn")).toBe("ফজর");
    expect(label("fajr", "ar")).toBe("الفجر");
    expect(label("sehri", "en")).toBe("Sehri");
  });
  it("converts numerals per script", () => {
    expect(toNumerals("4:47", "en")).toBe("4:47");
    expect(toNumerals("4:47", "bn")).toBe("৪:৪৭");
    expect(toNumerals("123", "ar")).toBe("١٢٣");
  });
  it("reports text direction", () => {
    expect(dir("ar")).toBe("rtl");
    expect(dir("bn")).toBe("ltr");
  });
});
