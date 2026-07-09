import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { Studio } from "../src/studio/Studio";
import { getCountdowns, getMethods, getMonthly, getQibla } from "../src/lib/miqaat";

vi.mock("../src/lib/miqaat", () => ({
  getMonthly: vi.fn(),
  getQibla: vi.fn(),
  getCountdowns: vi.fn(),
  getMethods: vi.fn(),
}));

vi.mock("../src/lib/geo", () => ({
  searchCity: vi.fn().mockResolvedValue([]),
  defaultMethod: vi.fn(() => "MuslimWorldLeague"),
  currentLocation: vi.fn().mockRejectedValue(new Error("not available in tests")),
}));

const mockMonthly = {
  location: { lat: 23.81, lon: 90.41, timezone: "Asia/Dhaka" },
  method: "MuslimWorldLeague",
  madhab: "shafi",
  year: 2026,
  month: 7,
  days: [],
};

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, "", "/");
  vi.mocked(getMonthly).mockResolvedValue(mockMonthly);
  vi.mocked(getQibla).mockResolvedValue({ bearing: 293, distanceKm: 4600 });
  vi.mocked(getCountdowns).mockResolvedValue({
    isRamadan: false,
    daysUntilRamadan: 200,
    daysUntilEidAlFitr: 10,
    daysUntilEidAlAdha: 50,
  });
  vi.mocked(getMethods).mockResolvedValue([
    { id: "MuslimWorldLeague", name: "Muslim World League" },
  ]);
});

describe("Studio", () => {
  it("renders the location search input and the three format tabs", () => {
    render(<Studio />);
    expect(screen.getByLabelText("Location")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Daily" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Monthly" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Year" })).toBeInTheDocument();
  });

  it("fetches the monthly schedule for the default location on mount", async () => {
    render(<Studio />);
    await waitFor(() => {
      expect(getMonthly).toHaveBeenCalledWith(
        expect.objectContaining({ lat: 23.81, lon: 90.41 }),
      );
    });
  });
});
