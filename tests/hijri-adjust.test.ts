import { describe, expect, it } from "vitest";
import { adjustHijri, hijriFor } from "../src/lib/hijri-adjust";
import type { MonthlyResponse } from "../src/lib/miqaat";

describe("hijri adjustment", () => {
  it("matches the API's Umm al-Qura dates with no shift", () => {
    expect(hijriFor("2026-10-01", 0)).toEqual({ day: 20, monthName: "Rabi' al-Thani", year: 1448 });
    expect(hijriFor("2026-10-14", 0)).toEqual({ day: 3, monthName: "Jumada al-Awwal", year: 1448 });
  });

  it("moves dates across month and year ends", () => {
    // 1 Ramadan 1447 is 18 Feb 2026; a day behind it is still Sha'ban.
    expect(hijriFor("2026-02-18", -1).monthName).toBe("Sha'ban");
    expect(hijriFor("2026-02-17", 1)).toEqual({ day: 1, monthName: "Ramadan", year: 1447 });
  });

  it("leaves the month untouched at 0 and shifts every day otherwise", () => {
    const m = {
      days: [{ dateISO: "2026-10-14", hijri: { day: 3, monthName: "Jumada al-Awwal", year: 1448 } }],
    } as unknown as MonthlyResponse;
    expect(adjustHijri(m, 0)).toBe(m);
    expect(adjustHijri(m, -1).days[0].hijri.day).toBe(2);
    expect(m.days[0].hijri.day).toBe(3);
  });
});
