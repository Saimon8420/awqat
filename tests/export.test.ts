import { describe, it, expect, vi, beforeEach } from "vitest";
import { exportScale, fitToPage, exportYearZip } from "../src/lib/export";

describe("exportScale", () => {
  it("computes the pixel ratio to reach a target width", () => {
    expect(exportScale({ width: 540 }, 1080)).toBeCloseTo(2);
    expect(exportScale({ width: 1080 }, 1080)).toBeCloseTo(1);
  });
});

describe("fitToPage", () => {
  it("fits a wider-than-page image by width, centering vertically", () => {
    // 1080x1350 portrait image into a squarer 600x600 page: width-bound.
    const { x, y, w, h } = fitToPage({ width: 1080, height: 1350 }, { width: 600, height: 900 });
    expect(w).toBeCloseTo(600);
    expect(h).toBeCloseTo(750);
    expect(x).toBeCloseTo(0);
    expect(y).toBeCloseTo((900 - 750) / 2);
  });

  it("fits a wide landscape image into a portrait page by width, centering vertically", () => {
    // 1587x1123 (A3 landscape canvas, aspect ~1.41) into a narrower A4
    // portrait-ish page (aspect ~0.71) — width is the binding constraint.
    const { x, y, w, h } = fitToPage(
      { width: 1587, height: 1123 },
      { width: 595, height: 842 },
    );
    expect(w).toBeCloseTo(595);
    expect(h).toBeCloseTo((1123 / 1587) * 595);
    expect(x).toBeCloseTo(0);
    expect(y).toBeCloseTo((842 - h) / 2);
  });
});

vi.mock("file-saver", () => ({ saveAs: vi.fn() }));

describe("exportYearZip", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders all 12 months, zips them, and saves the archive", async () => {
    const { saveAs } = await import("file-saver");
    const renderMonth = vi.fn(
      async (m: number) => new Blob([`month-${m}`], { type: "image/png" }),
    );

    await exportYearZip(renderMonth, "awqat-2026-dhaka-months.zip");

    expect(renderMonth).toHaveBeenCalledTimes(12);
    for (let m = 1; m <= 12; m++) {
      expect(renderMonth).toHaveBeenCalledWith(m);
    }
    expect(saveAs).toHaveBeenCalledTimes(1);
    const [blobArg, filenameArg] = vi.mocked(saveAs).mock.calls[0];
    expect(filenameArg).toBe("awqat-2026-dhaka-months.zip");
    expect((blobArg as Blob).size).toBeGreaterThan(0);
  });

  it("propagates a renderMonth failure and stops early", async () => {
    const renderMonth = vi.fn(async (m: number) => {
      if (m === 3) throw new Error("month 3 failed");
      return new Blob([`month-${m}`], { type: "image/png" });
    });

    await expect(exportYearZip(renderMonth, "x.zip")).rejects.toThrow("month 3 failed");
    expect(renderMonth).toHaveBeenCalledTimes(3);
  });
});
