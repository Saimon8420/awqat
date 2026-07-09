import { describe, it, expect, vi, afterEach } from "vitest";
import { defaultMethod, searchCity, currentLocation } from "../src/lib/geo";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("geo", () => {
  it("maps country to a sensible default method", () => {
    expect(defaultMethod("Bangladesh")).toBe("Karachi");
    expect(defaultMethod("Egypt")).toBe("Egyptian");
    expect(defaultMethod("Saudi Arabia")).toBe("UmmAlQura");
    expect(defaultMethod("Nowhere")).toBe("MuslimWorldLeague");
  });

  it("maps additional common countries", () => {
    expect(defaultMethod("Pakistan")).toBe("Karachi");
    expect(defaultMethod("India")).toBe("Karachi");
    expect(defaultMethod("United States")).toBe("NorthAmerica");
    expect(defaultMethod("Canada")).toBe("NorthAmerica");
    expect(defaultMethod("United Arab Emirates")).toBe("Dubai");
    expect(defaultMethod("Turkey")).toBe("Turkey");
    expect(defaultMethod("Kuwait")).toBe("Kuwait");
    expect(defaultMethod("Qatar")).toBe("Qatar");
    expect(defaultMethod("Singapore")).toBe("Singapore");
    expect(defaultMethod("Iran")).toBe("Tehran");
  });

  it("maps Open-Meteo geocoding results", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          results: [{ name: "Dhaka", latitude: 23.81, longitude: 90.41, country: "Bangladesh" }],
        }),
      }),
    );
    const r = await searchCity("Dhaka");
    expect(r[0]).toMatchObject({ name: "Dhaka", lat: 23.81, lon: 90.41, country: "Bangladesh" });
  });

  it("returns an empty array when there are no results", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({}),
      }),
    );
    const r = await searchCity("Nowhereville");
    expect(r).toEqual([]);
  });

  it("resolves the current location from navigator.geolocation", async () => {
    const getCurrentPosition = vi.fn((success: PositionCallback) => {
      success({
        coords: { latitude: 23.81, longitude: 90.41 },
      } as GeolocationPosition);
    });
    vi.stubGlobal("navigator", { geolocation: { getCurrentPosition } });
    const loc = await currentLocation();
    expect(loc).toEqual({ lat: 23.81, lon: 90.41 });
  });
});
