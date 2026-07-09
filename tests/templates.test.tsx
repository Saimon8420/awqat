import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { PersonalDaily } from "../src/templates/daily/PersonalDaily";
import { DEFAULT_STATE } from "../src/lib/state";
import { THEMES } from "../src/templates/themes";
import type { MonthlyResponse } from "../src/lib/miqaat";
import type { TemplateProps } from "../src/templates/registry";

const theme = THEMES[0]; // emerald, accent "#0f9d63"

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

function makeProps(overrides: Partial<TemplateProps["state"]> = {}): TemplateProps {
  return {
    monthly: mockMonthly,
    specialDays: {},
    theme,
    state: {
      ...DEFAULT_STATE,
      city: "Dhaka",
      year: 2026,
      month: 7,
      day: 9,
      ...overrides,
    },
  };
}

/** The Sehri time <p> lives in the same wrapper div as the "Sehri" label <p>. */
function sehriTimeEl(): HTMLElement {
  const sehriLabel = screen.getByText("Sehri");
  return within(sehriLabel.parentElement as HTMLElement).getByText(/[0-9০-৯]/);
}

describe("template accent + numerals", () => {
  it("keeps English labels but renders Bengali digits when numerals is 'bn' and lang stays 'en'", () => {
    const props = makeProps({ lang: "en", numerals: "bn" });
    render(<PersonalDaily {...props} />);

    // Label stays English (driven by state.lang).
    expect(screen.getByText("Sehri")).toBeInTheDocument();

    // The Sehri time renders using Bengali digits (driven by
    // state.numerals, independent of state.lang).
    const sehriTime = sehriTimeEl();
    expect(sehriTime.textContent).toMatch(/^[০-৯:]+\s?(AM|PM)$/);
    // No Western digits should have leaked into the formatted time.
    expect(sehriTime.textContent).not.toMatch(/[0-9]/);
  });

  it("renders Western digits by default (lang and numerals both 'en'), unchanged from before the fix", () => {
    const props = makeProps({ lang: "en", numerals: "en" });
    render(<PersonalDaily {...props} />);
    expect(screen.getByText("Sehri")).toBeInTheDocument();
    const sehriTime = sehriTimeEl();
    expect(sehriTime.textContent).toMatch(/^\d{1,2}:\d{2}\s?(AM|PM)$/);
  });

  it("uses the user's custom accent hex for the Sehri time color when state.accent is set", () => {
    const customAccent = "#e11d48";
    const props = makeProps({ accent: customAccent });
    render(<PersonalDaily {...props} />);
    expect(sehriTimeEl()).toHaveStyle({ color: customAccent });
  });

  it("falls back to the theme's accent color when state.accent is empty", () => {
    const props = makeProps({ accent: "" });
    render(<PersonalDaily {...props} />);
    expect(sehriTimeEl()).toHaveStyle({ color: theme.accent });
  });
});
