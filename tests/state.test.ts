import { describe, it, expect, beforeEach } from "vitest";
import { encodeState, decodeState, saveLocal, loadLocal, migrateState, DEFAULT_STATE, type StudioState } from "../src/lib/state";

beforeEach(() => localStorage.clear());

describe("state", () => {
  it("round-trips core fields through the URL", () => {
    const s = { ...DEFAULT_STATE, city:"Dhaka", lat:23.81, lon:90.41, format:"monthly" as const, lang:"bn" as const };
    const decoded = decodeState(encodeState(s));
    expect(decoded.city).toBe("Dhaka");
    expect(decoded.lat).toBeCloseTo(23.81);
    expect(decoded.format).toBe("monthly");
    expect(decoded.lang).toBe("bn");
  });
  it("omits data-URI fields from the URL but keeps them in localStorage", () => {
    const s = { ...DEFAULT_STATE, bgImage: "data:image/png;base64,AAAA" };
    expect(encodeState(s)).not.toContain("data:image");
    saveLocal(s);
    expect(loadLocal()?.bgImage).toBe("data:image/png;base64,AAAA");
  });

  it("ignores a malformed numeric param (?lat=abc) instead of propagating NaN", () => {
    const decoded = decodeState("lat=abc&lon=90.41");
    expect(decoded.lat).toBeUndefined();
    expect(decoded.lon).toBeCloseTo(90.41);
  });

  it("ignores an invalid ?format=bogus instead of propagating it", () => {
    const decoded = decodeState("format=bogus&city=Dhaka");
    expect(decoded.format).toBeUndefined();
    expect(decoded.city).toBe("Dhaka");
  });

  it("ignores an invalid lang/numerals value", () => {
    const decoded = decodeState("lang=xx&numerals=zz");
    expect(decoded.lang).toBeUndefined();
    expect(decoded.numerals).toBeUndefined();
  });

  it("round-trips the new bgDim/bgBlur/radius fields through the URL", () => {
    const s = { ...DEFAULT_STATE, bgDim: 20, bgBlur: 8, radius: 24 };
    const decoded = decodeState(encodeState(s));
    expect(decoded.bgDim).toBe(20);
    expect(decoded.bgBlur).toBe(8);
    expect(decoded.radius).toBe(24);
  });

  it("defaults to Mihrab Night in Navy & Gold with every 'show on card' switch on", () => {
    expect(DEFAULT_STATE.template).toBe("mihrab");
    expect(DEFAULT_STATE.theme).toBe("mihrab-navy");
    expect(DEFAULT_STATE.masjid).toBe(false);
    expect(DEFAULT_STATE.ramadan).toBe(false);
    expect(DEFAULT_STATE.showFasting && DEFAULT_STATE.showArabic && DEFAULT_STATE.showNext).toBe(true);
  });

  it("round-trips the design, colour and mode switches through the URL", () => {
    const s: StudioState = { ...DEFAULT_STATE, template: "parchment", theme: "parchment-forest", masjid: true, ramadan: true, showArabic: false };
    const decoded = decodeState(encodeState(s));
    expect(decoded.template).toBe("parchment");
    expect(decoded.theme).toBe("parchment-forest");
    expect(decoded.masjid).toBe(true);
    expect(decoded.ramadan).toBe(true);
    expect(decoded.showArabic).toBe(false);
  });

  it("opens old shared links in the matching new design and mode", () => {
    const from = (template: string, theme = "emerald") =>
      migrateState({ ...DEFAULT_STATE, ...decodeState(`template=${template}&theme=${theme}`) } as StudioState);
    expect(from("daily-classic")).toMatchObject({ template: "mihrab", masjid: false, ramadan: false });
    expect(from("monthly-masjid")).toMatchObject({ template: "mihrab", masjid: true });
    expect(from("year-org")).toMatchObject({ template: "mihrab", masjid: true });
    expect(from("monthly-ramadan")).toMatchObject({ template: "mihrab", ramadan: true });
    // The old shared theme ids aren't colours of the new designs → design default.
    expect(from("daily-classic", "gold-navy").theme).toBe("mihrab-navy");
  });

  it("fills switches that older saved settings never had", () => {
    const old = { ...DEFAULT_STATE } as Partial<StudioState>;
    delete old.showFasting;
    delete old.masjid;
    const migrated = migrateState(old as StudioState);
    expect(migrated.showFasting).toBe(true);
    expect(migrated.masjid).toBe(false);
  });
});
