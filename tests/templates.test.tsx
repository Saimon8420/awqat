import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { DEFAULT_STATE, type StudioState } from "../src/lib/state";
import { resolveTheme, type DesignId } from "../src/templates/themes";
import { componentFor, type TemplateProps } from "../src/templates/registry";
import { MihrabDaily } from "../src/templates/designs/mihrab";
import type { DayTimes, MonthlyResponse } from "../src/lib/miqaat";
import type { Lang } from "../src/lib/i18n";

const mkDay = (dateISO: string, hijriDay: number, monthName: string): DayTimes => ({
  dateISO,
  hijri: { day: hijriDay, monthName, year: 1447 },
  prayers: {
    fajr: `${dateISO}T04:00:00.000Z`,
    sunrise: `${dateISO}T05:30:00.000Z`,
    dhuhr: `${dateISO}T12:00:00.000Z`,
    asr: `${dateISO}T15:30:00.000Z`,
    maghrib: `${dateISO}T18:00:00.000Z`,
    isha: `${dateISO}T19:30:00.000Z`,
  },
  fasting: { sehri: `${dateISO}T03:45:00.000Z`, iftar: `${dateISO}T18:00:00.000Z` },
});

const mockMonthly: MonthlyResponse = {
  location: { lat: 23.81, lon: 90.41, timezone: "Asia/Dhaka" },
  method: "MuslimWorldLeague",
  madhab: "shafi",
  year: 2026,
  month: 7,
  days: [mkDay("2026-07-09", 24, "Muharram"), mkDay("2026-07-10", 25, "Muharram")],
};

const ramadanMonthly: MonthlyResponse = {
  ...mockMonthly,
  month: 3,
  days: [mkDay("2026-03-10", 21, "Ramadan"), mkDay("2026-03-11", 22, "Ramadan")],
};

function props(overrides: Partial<StudioState> = {}, monthly = mockMonthly): TemplateProps {
  const state: StudioState = {
    ...DEFAULT_STATE,
    city: "Dhaka",
    year: 2026,
    month: monthly.month,
    day: Number(monthly.days[0].dateISO.slice(8, 10)),
    ...overrides,
  };
  return {
    monthly,
    specialDays: {},
    theme: resolveTheme(state.template, state.theme),
    state,
    months: Array.from({ length: 12 }, () => monthly),
  };
}

/** The Sehri time sits right after its "Sehri ends" label. */
function sehriTimeEl(): HTMLElement {
  return screen.getByText("Sehri ends").nextElementSibling as HTMLElement;
}

describe("every design renders every format in every language", () => {
  const designs: DesignId[] = ["mihrab", "parchment", "daylight"];
  const formats = ["daily", "monthly", "year"] as const;
  const langs: Lang[] = ["en", "bn", "ar"];
  for (const design of designs) {
    for (const format of formats) {
      for (const lang of langs) {
        it(`${design} · ${format} · ${lang}`, () => {
          const Template = componentFor(design, format);
          const { container } = render(<Template {...props({ template: design, format, lang, numerals: lang })} />);
          const root = container.firstElementChild as HTMLElement;
          expect(root.getAttribute("dir")).toBe(lang === "ar" ? "rtl" : "ltr");
          // Every export states how its times were calculated.
          expect(container.textContent).toContain("Method: MuslimWorldLeague · shafi");
        });
      }
    }
  }
});

describe("daily card details", () => {
  it("keeps English labels but renders Bengali digits when numerals is 'bn' and lang stays 'en'", () => {
    render(<MihrabDaily {...props({ lang: "en", numerals: "bn" })} />);
    const time = sehriTimeEl().textContent ?? "";
    expect(time).toMatch(/[০-৯]/);
    expect(time).not.toMatch(/[0-9]/);
  });

  it("renders Western digits by default", () => {
    render(<MihrabDaily {...props()} />);
    expect(sehriTimeEl().textContent).toMatch(/^\d{1,2}:\d{2}/);
  });

  it("tints the Sehri label with a custom accent, or the design's gold by default", () => {
    const { unmount } = render(<MihrabDaily {...props({ accent: "#e11d48" })} />);
    expect(screen.getByText("Sehri ends")).toHaveStyle({ color: "#e11d48" });
    unmount();
    render(<MihrabDaily {...props({ accent: "" })} />);
    expect(screen.getByText("Sehri ends")).toHaveStyle({ color: "#e8c977" });
  });

  it("shows Arabic prayer names alongside English unless switched off", () => {
    const { unmount } = render(<MihrabDaily {...props()} />);
    expect(screen.getByText("الفجر")).toBeInTheDocument();
    unmount();
    render(<MihrabDaily {...props({ showArabic: false })} />);
    expect(screen.queryByText("الفجر")).not.toBeInTheDocument();
  });

  it("hides Sehri & Iftar when switched off — but Ramadan mode always shows them", () => {
    const { unmount } = render(<MihrabDaily {...props({ showFasting: false })} />);
    expect(screen.queryByText("Sehri ends")).not.toBeInTheDocument();
    unmount();
    render(<MihrabDaily {...props({ showFasting: false, ramadan: true })} />);
    expect(screen.getByText("Sehri ends")).toBeInTheDocument();
  });

  it("brands the card in Masjid mode", () => {
    for (const design of ["mihrab", "parchment", "daylight"] as const) {
      const Template = componentFor(design, "daily");
      const { unmount } = render(
        <Template
          {...props({
            template: design,
            masjid: true,
            org: { name: "Baitul Mukarram", address: "Paltan, Dhaka", tagline: "National Mosque" },
          })}
        />,
      );
      expect(screen.getAllByText(/Baitul Mukarram/).length).toBeGreaterThan(0);
      expect(screen.getAllByText(/Paltan, Dhaka/).length).toBeGreaterThan(0);
      expect(screen.getByText("National Mosque")).toBeInTheDocument();
      unmount();
    }
  });

  it("shows the personal greeting and dua when Masjid mode is off", () => {
    render(<MihrabDaily {...props({ personal: { greeting: "Jumu'ah Mubarak", dua: "Rabbi zidni ilma" } })} />);
    expect(screen.getByText("Jumu'ah Mubarak")).toBeInTheDocument();
    expect(screen.getByText("Rabbi zidni ilma")).toBeInTheDocument();
  });
});

describe("monthly Ramadan mode", () => {
  it("leads with Sehri and Iftar and titles the page Ramadan", () => {
    const Monthly = componentFor("parchment", "monthly");
    render(<Monthly {...props({ template: "parchment", format: "monthly", ramadan: true }, ramadanMonthly)} />);
    expect(screen.getByText("Ramadan 1447")).toBeInTheDocument();
    const heads = screen.getAllByRole("columnheader").map((th) => th.textContent);
    expect(heads.slice(0, 4)).toEqual(["Date", "Hijri", "Sehri", "Iftar"]);
  });

  it("puts Sehri before the prayers and Iftar after them outside Ramadan mode", () => {
    const Monthly = componentFor("daylight", "monthly");
    render(<Monthly {...props({ template: "daylight", format: "monthly" })} />);
    const heads = screen.getAllByRole("columnheader").map((th) => th.textContent);
    expect(heads[2]).toBe("Sehri");
    expect(heads[heads.length - 1]).toBe("Iftar");
  });
});
