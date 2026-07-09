import { describe, it, expect, beforeEach } from "vitest";
import { encodeState, decodeState, saveLocal, loadLocal, DEFAULT_STATE } from "../src/lib/state";

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
});
