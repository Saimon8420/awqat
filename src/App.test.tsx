import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";

vi.mock("@/lib/miqaat", () => ({
  getMonthly: vi.fn().mockResolvedValue({
    location: { lat: 23.81, lon: 90.41, timezone: "Asia/Dhaka" },
    method: "MuslimWorldLeague",
    madhab: "shafi",
    year: 2026,
    month: 7,
    days: [],
  }),
  getQibla: vi.fn().mockResolvedValue({ bearing: 293, distanceKm: 4600 }),
  getCountdowns: vi.fn().mockResolvedValue({
    isRamadan: false,
    daysUntilRamadan: 200,
    daysUntilEidAlFitr: 10,
    daysUntilEidAlAdha: 50,
  }),
  getMethods: vi.fn().mockResolvedValue([{ id: "MuslimWorldLeague", name: "Muslim World League" }]),
}));

vi.mock("@/lib/geo", () => ({
  searchCity: vi.fn().mockResolvedValue([]),
  defaultMethod: vi.fn(() => "MuslimWorldLeague"),
  currentLocation: vi.fn().mockRejectedValue(new Error("not available in tests")),
}));

beforeEach(() => {
  localStorage.clear();
  window.history.replaceState(null, "", "/");
});

describe("App", () => {
  it("renders the Awqat studio shell", () => {
    render(<App />);
    expect(screen.getByText("Awqat Studio")).toBeInTheDocument();
    expect(screen.getByLabelText("Location")).toBeInTheDocument();
  });
});
