import { describe, it, expect } from "vitest";
import { formatTime } from "../src/lib/format";

const iso = "2026-03-01T04:47:00+06:00";
describe("formatTime", () => {
  it("formats 12h English", () => {
    expect(formatTime(iso, { hour12: true, lang: "en", timezone: "Asia/Dhaka" })).toBe("4:47 AM");
  });
  it("formats 24h English", () => {
    expect(formatTime(iso, { hour12: false, lang: "en", timezone: "Asia/Dhaka" })).toBe("04:47");
  });
  it("localizes numerals for Bangla", () => {
    expect(formatTime(iso, { hour12: false, lang: "bn", timezone: "Asia/Dhaka" })).toBe("০৪:৪৭");
  });
});
