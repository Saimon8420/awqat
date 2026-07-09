import { describe, it, expect, vi } from "vitest";
import {
  isRamadanMonth,
  specialDaysForMonth,
  ramadanMonthOfYear,
  dayLabel,
} from "../src/lib/calendar";
import type { DayTimes, MonthlyResponse } from "../src/lib/miqaat";

const mk = (dateISO: string, day: number, monthName: string): DayTimes => ({
  dateISO,
  hijri: { day, monthName, year: 1447 },
  prayers: { fajr: "", sunrise: "", dhuhr: "", asr: "", maghrib: "", isha: "" },
  fasting: { sehri: "", iftar: "" },
});

describe("calendar", () => {
  it("detects a Ramadan-dominant month", () => {
    const days = [mk("2026-03-01", 12, "Ramadan"), mk("2026-03-02", 13, "Ramadan"), mk("2026-03-03", 14, "Sha'ban")];
    expect(isRamadanMonth(days)).toBe(true);
  });

  it("rejects a non-Ramadan month", () => {
    expect(isRamadanMonth([mk("2026-05-01", 1, "Shawwal"), mk("2026-05-02", 2, "Shawwal")])).toBe(false);
  });

  it("derives white days and Laylat al-Qadr from hijri", () => {
    const days = [mk("2026-03-13", 21, "Ramadan"), mk("2026-03-05", 13, "Ramadan"), mk("2026-03-06", 16, "Ramadan")];
    const sp = specialDaysForMonth(days);
    expect(sp["2026-03-13"]).toEqual(expect.arrayContaining(["ramadan", "laylat-al-qadr"]));
    expect(sp["2026-03-05"]).toEqual(expect.arrayContaining(["ramadan", "white-day"]));
    expect(sp["2026-03-06"]).toEqual(["ramadan"]);
  });

  it("flags Eid al-Fitr on 1 Shawwal", () => {
    const sp = specialDaysForMonth([mk("2026-03-20", 1, "Shawwal")]);
    expect(sp["2026-03-20"]).toEqual(expect.arrayContaining(["eid-al-fitr"]));
  });

  it("flags Eid al-Adha on 10 Dhu al-Hijjah (confirmed live spelling)", () => {
    const sp = specialDaysForMonth([mk("2026-05-25", 10, "Dhu al-Hijjah")]);
    expect(sp["2026-05-25"]).toEqual(expect.arrayContaining(["eid-al-adha"]));
  });

  it("flags Eid al-Adha case-insensitively against alternate accepted spellings", () => {
    const sp = specialDaysForMonth([
      mk("2026-05-25", 10, "dhu al-hijjah"),
      mk("2026-06-24", 10, "Dhul-Hijjah"),
    ]);
    expect(sp["2026-05-25"]).toEqual(expect.arrayContaining(["eid-al-adha"]));
    expect(sp["2026-06-24"]).toEqual(expect.arrayContaining(["eid-al-adha"]));
  });

  it("flags Ashura on 10 Muharram", () => {
    const sp = specialDaysForMonth([mk("2026-06-25", 10, "Muharram")]);
    expect(sp["2026-06-25"]).toEqual(expect.arrayContaining(["ashura"]));
  });

  it("does not flag white-day/eid/ashura for unrelated day+month combos", () => {
    const sp = specialDaysForMonth([mk("2026-01-10", 10, "Safar")]);
    expect(sp["2026-01-10"] ?? []).toEqual([]);
  });

  it("reads the Gregorian day from the date string", () => {
    expect(dayLabel(mk("2026-03-07", 18, "Ramadan"))).toEqual({ gregDay: 7, hijriDay: 18 });
  });
});

describe("ramadanMonthOfYear", () => {
  const mkMonthly = (month: number, days: DayTimes[]): MonthlyResponse => ({
    location: { lat: 21.42, lon: 39.83, timezone: "Asia/Riyadh" },
    method: "",
    madhab: "",
    year: 2026,
    month,
    days,
  });

  it("returns the Gregorian month that predominantly contains Ramadan", async () => {
    const getMonthlyFn = vi.fn(async (p: { lat: number; lon: number; year: number; month: number }) => {
      if (p.month === 3) {
        return mkMonthly(3, [mk("2026-03-01", 12, "Ramadan"), mk("2026-03-02", 13, "Ramadan")]);
      }
      return mkMonthly(p.month, [mk(`2026-${String(p.month).padStart(2, "0")}-01`, 1, "Shawwal")]);
    });

    const result = await ramadanMonthOfYear(getMonthlyFn, { lat: 21.42, lon: 39.83 }, 2026);
    expect(result).toBe(3);
    expect(getMonthlyFn).toHaveBeenCalledWith(expect.objectContaining({ lat: 21.42, lon: 39.83, year: 2026, month: 1 }));
  });

  it("short-circuits and stops calling after finding the Ramadan month", async () => {
    const getMonthlyFn = vi.fn(async (p: { month: number }) => {
      if (p.month === 2) {
        return mkMonthly(2, [mk("2026-02-01", 10, "Ramadan"), mk("2026-02-02", 11, "Ramadan")]);
      }
      return mkMonthly(p.month, [mk("2026-01-01", 1, "Muharram")]);
    });

    const result = await ramadanMonthOfYear(getMonthlyFn, { lat: 0, lon: 0 }, 2026);
    expect(result).toBe(2);
    expect(getMonthlyFn).toHaveBeenCalledTimes(2);
  });

  it("returns null if no month in the year is Ramadan-dominant", async () => {
    const getMonthlyFn = vi.fn(async (p: { month: number }) =>
      mkMonthly(p.month, [mk("2026-01-01", 1, "Shawwal")]),
    );

    const result = await ramadanMonthOfYear(getMonthlyFn, { lat: 0, lon: 0 }, 2026);
    expect(result).toBeNull();
    expect(getMonthlyFn).toHaveBeenCalledTimes(12);
  });
});
