import { describe, it, expect } from "vitest";
import { DESIGNS, componentFor, designById } from "../src/templates/registry";
import { THEMES, resolveTheme, themesFor } from "../src/templates/themes";

describe("design registry", () => {
  it("has the ten designs, each rendering every format", () => {
    expect(DESIGNS.map((d) => d.id)).toEqual(["mihrab", "parchment", "daylight", "alhambra", "lantern", "minimal", "desert", "sixtydome", "kiswa", "crescent"]);
    for (const d of DESIGNS) {
      for (const format of ["daily", "monthly", "year"] as const) {
        expect(typeof componentFor(d.id, format)).toBe("function");
      }
    }
  });

  it("falls back to Mihrab Night for an unknown design id", () => {
    expect(designById("nope").id).toBe("mihrab");
  });

  it("gives every design its own colours, Mihrab defaulting to Navy & Gold", () => {
    expect(themesFor("mihrab").map((t) => t.name)).toEqual([
      "Navy & Gold",
      "Emerald & Gold",
      "Maroon & Gold",
      "Black & Gold",
    ]);
    expect(themesFor("parchment")).toHaveLength(3);
    expect(themesFor("daylight")).toHaveLength(3);
    for (const d of ["alhambra", "lantern", "minimal", "desert", "sixtydome", "kiswa", "crescent"] as const) expect(themesFor(d)).toHaveLength(3);
    expect(THEMES).toHaveLength(31);
  });

  it("resolves a colour only within its design", () => {
    expect(resolveTheme("parchment", "parchment-forest").id).toBe("parchment-forest");
    // A Mihrab colour isn't valid for Daylight, so Daylight's default is used.
    expect(resolveTheme("daylight", "mihrab-navy").id).toBe("daylight-emerald");
  });
});
