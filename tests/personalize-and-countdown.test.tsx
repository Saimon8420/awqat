import { describe, it, expect, vi, afterEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { LiveCountdown } from "../src/studio/LiveCountdown";
import { PersonalizeFields } from "../src/studio/PersonalizeFields";
import { StudioContext, type StudioContextValue } from "../src/studio/context";
import { DEFAULT_STATE, type StudioState } from "../src/lib/state";
import type { MonthlyResponse } from "../src/lib/miqaat";

const mockMonthly: MonthlyResponse = {
  location: { lat: 23.81, lon: 90.41, timezone: "Asia/Dhaka" },
  method: "MuslimWorldLeague",
  madhab: "shafi",
  year: 2026,
  month: 7,
  days: [
    {
      dateISO: "2026-07-09",
      hijri: { day: 24, monthName: "Muharram", year: 1448 },
      prayers: {
        fajr: "2026-07-09T04:00:00.000Z",
        sunrise: "2026-07-09T05:30:00.000Z",
        dhuhr: "2026-07-09T12:00:00.000Z",
        asr: "2026-07-09T15:30:00.000Z",
        maghrib: "2026-07-09T18:00:00.000Z",
        isha: "2026-07-09T19:30:00.000Z",
      },
      fasting: { sehri: "2026-07-09T03:45:00.000Z", iftar: "2026-07-09T18:00:00.000Z" },
    },
  ],
};

const dailyState: StudioState = {
  ...DEFAULT_STATE,
  city: "Dhaka",
  year: 2026,
  month: 7,
  day: 9,
  hour12: true,
  numerals: "en",
};

function renderWithStudio(ui: React.ReactElement, state: StudioState) {
  const ctxValue: StudioContextValue = {
    state,
    updateState: vi.fn(),
    methodOverridden: false,
    setMethodOverridden: vi.fn(),
    setTemplateTouched: vi.fn(),
    exporting: false,
    setExporting: vi.fn(),
  };
  return render(<StudioContext.Provider value={ctxValue}>{ui}</StudioContext.Provider>);
}

describe("LiveCountdown", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("ticks: shows a live remaining-time string that updates on the 1s interval", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-09T03:00:00.000Z")); // 45 min before sehri
    render(<LiveCountdown monthly={mockMonthly} state={dailyState} />);

    expect(screen.getByRole("status")).toHaveTextContent(/Sehri ends in 45m 0s/);

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(screen.getByRole("status")).toHaveTextContent(/Sehri ends in 44m 55s/);
  });

  it("frozen: renders a static clock-time snapshot with no 'in Xs' phrasing and never ticks", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-09T03:00:00.000Z"));
    render(<LiveCountdown monthly={mockMonthly} state={dailyState} frozen />);

    const el = screen.getByRole("status");
    const initialText = el.textContent;
    expect(initialText).toMatch(/Sehri ends at/);
    expect(initialText).not.toMatch(/in \d/);

    act(() => {
      vi.advanceTimersByTime(10000);
    });
    expect(screen.getByRole("status").textContent).toBe(initialText);
  });
});

describe("PersonalizeFields", () => {
  it("shows organization fields (logo/name/address/tagline) for an org-lane template", () => {
    renderWithStudio(<PersonalizeFields />, { ...dailyState, template: "daily-org" });
    expect(screen.getByLabelText("Logo")).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Address")).toBeInTheDocument();
    expect(screen.getByLabelText("Tagline")).toBeInTheDocument();
    expect(screen.queryByLabelText("Greeting")).not.toBeInTheDocument();
  });

  it("shows personal fields (greeting/dua) for a personal-lane template", () => {
    renderWithStudio(<PersonalizeFields />, { ...dailyState, template: "daily-classic" });
    expect(screen.getByLabelText("Greeting")).toBeInTheDocument();
    expect(screen.getByLabelText("Dua / verse")).toBeInTheDocument();
    expect(screen.queryByLabelText("Name")).not.toBeInTheDocument();
  });
});
