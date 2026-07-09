import { describe, it, expect } from "vitest";
import { templatesFor } from "../src/templates/registry";

describe("template registry", () => {
  it("returns only templates for the requested format", () => {
    const daily = templatesFor("daily");
    expect(daily.length).toBeGreaterThan(0);
    expect(daily.every((t) => t.format === "daily")).toBe(true);
  });
  it("filters by lane when given", () => {
    const orgMonthly = templatesFor("monthly", "organization");
    expect(orgMonthly.every((t) => t.lane === "organization")).toBe(true);
  });
});
