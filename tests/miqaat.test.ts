import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getMonthly,
  getQibla,
  getCountdowns,
  getMethods,
  parseHijri,
  __clearCache,
} from "../src/lib/miqaat";

const envelope = (data: unknown) => ({ success: true, data, meta: {} });

beforeEach(() => {
  __clearCache();
  localStorage.clear();
});

const monthlyBody = {
  success: true,
  data: {
    year: 2026, month: 3,
    days: [{
      date: "2026-03-01",
      hijri: "12 Ramadan 1447 AH",
      prayers: {
        fajr:{iso:"2026-03-01T05:05:00+06:00",time24:"05:05",time12:"5:05 AM"},
        sunrise:{iso:"2026-03-01T06:21:00+06:00",time24:"06:21",time12:"6:21 AM"},
        dhuhr:{iso:"2026-03-01T12:12:00+06:00",time24:"12:12",time12:"12:12 PM"},
        asr:{iso:"2026-03-01T15:32:00+06:00",time24:"15:32",time12:"3:32 PM"},
        maghrib:{iso:"2026-03-01T18:01:00+06:00",time24:"18:01",time12:"6:01 PM"},
        isha:{iso:"2026-03-01T19:12:00+06:00",time24:"19:12",time12:"7:12 PM"},
      },
      fasting: {
        suhoorEnd:{iso:"2026-03-01T04:55:00+06:00",time24:"04:55",time12:"4:55 AM"},
        iftar:{iso:"2026-03-01T18:01:00+06:00",time24:"18:01",time12:"6:01 PM"},
        duration:"12h 56m",
      },
    }],
  },
  meta: { location:{ latitude:23.81, longitude:90.41, timezone:"Asia/Dhaka" }, params:{ method:"Karachi", madhab:"hanafi" } },
};

describe("getMonthly", () => {
  it("maps the real Miqaat monthly envelope into DayTimes[] and caches the call", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => monthlyBody });
    vi.stubGlobal("fetch", fetchMock);

    const r1 = await getMonthly({ lat: 23.81, lon: 90.41, year: 2026, month: 3 });
    expect(fetchMock.mock.calls[0][0]).toContain("lng=90.41"); // uses lng, not lon
    expect(r1.location.timezone).toBe("Asia/Dhaka");
    expect(r1.method).toBe("Karachi");
    expect(r1.madhab).toBe("hanafi");
    expect(r1.days[0].prayers.fajr).toBe("2026-03-01T05:05:00+06:00");
    expect(r1.days[0].fasting.sehri).toBe("2026-03-01T04:55:00+06:00"); // suhoorEnd -> sehri
    expect(r1.days[0].hijri).toEqual({ day: 12, monthName: "Ramadan", year: 1447 }); // parsed from string

    const r2 = await getMonthly({ lat: 23.81, lon: 90.41, year: 2026, month: 3 });
    expect(r2.days[0].prayers.fajr).toBe("2026-03-01T05:05:00+06:00");
    expect(fetchMock).toHaveBeenCalledTimes(1); // cached
  });
});

describe("getQibla", () => {
  it("maps direction -> bearing and distanceToMakkah.km -> distanceKm, and caches", async () => {
    const body = envelope({ direction: 277.57, unit: "degrees", distanceToMakkah: { km: 5172 } });
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => body });
    vi.stubGlobal("fetch", fetchMock);

    const r1 = await getQibla({ lat: 23.81, lon: 90.41 });
    expect(fetchMock.mock.calls[0][0]).toContain("lng=90.41");
    expect(r1).toEqual({ bearing: 277.57, distanceKm: 5172 });

    const r2 = await getQibla({ lat: 23.81, lon: 90.41 });
    expect(r2).toEqual({ bearing: 277.57, distanceKm: 5172 });
    expect(fetchMock).toHaveBeenCalledTimes(1); // cached
  });
});

describe("getCountdowns", () => {
  it("maps the events envelope into Countdowns, and caches", async () => {
    const body = envelope({
      today: "2026-07-09",
      isRamadan: false,
      daysUntilRamadan: 214,
      daysUntilEidAlFitr: 243,
      daysUntilEidAlAdha: 311,
    });
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => body });
    vi.stubGlobal("fetch", fetchMock);

    const r1 = await getCountdowns({ lat: 23.81, lon: 90.41, year: 2026 });
    expect(fetchMock.mock.calls[0][0]).toContain("lng=90.41");
    expect(r1).toEqual({
      isRamadan: false,
      daysUntilRamadan: 214,
      daysUntilEidAlFitr: 243,
      daysUntilEidAlAdha: 311,
    });

    const r2 = await getCountdowns({ lat: 23.81, lon: 90.41, year: 2026 });
    expect(r2.daysUntilRamadan).toBe(214);
    expect(fetchMock).toHaveBeenCalledTimes(1); // cached
  });
});

describe("getMethods", () => {
  it("returns calculationMethods from the methods envelope, and caches", async () => {
    const body = envelope({
      calculationMethods: [
        { id: "Karachi", name: "University of Islamic Sciences, Karachi" },
        { id: "MuslimWorldLeague", name: "Muslim World League" },
      ],
      madhabs: [
        { id: "shafi", name: "Shafi" },
        { id: "hanafi", name: "Hanafi" },
      ],
    });
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => body });
    vi.stubGlobal("fetch", fetchMock);

    const r1 = await getMethods();
    expect(r1).toEqual([
      { id: "Karachi", name: "University of Islamic Sciences, Karachi" },
      { id: "MuslimWorldLeague", name: "Muslim World League" },
    ]);

    const r2 = await getMethods();
    expect(r2).toEqual(r1);
    expect(fetchMock).toHaveBeenCalledTimes(1); // cached
  });
});

describe("parseHijri", () => {
  it("parses a single-word month", () => {
    expect(parseHijri("12 Ramadan 1447 AH")).toEqual({ day: 12, monthName: "Ramadan", year: 1447 });
  });

  it("parses a multi-word month", () => {
    expect(parseHijri("10 Dhu al-Hijjah 1447 AH")).toEqual({
      day: 10,
      monthName: "Dhu al-Hijjah",
      year: 1447,
    });
  });
});
