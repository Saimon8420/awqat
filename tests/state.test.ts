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
});
