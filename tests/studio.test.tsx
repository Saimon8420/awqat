import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Studio } from "../src/studio/Studio";
import { getCountdowns, getMethods, getMonthly, getQibla } from "../src/lib/miqaat";
import { searchCity, defaultMethod } from "../src/lib/geo";

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

const mkDay = (dateISO: string, hijriDay: number, monthName: string) => ({
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

// A Ramadan-dominant month (see isRamadanMonth in src/lib/calendar.ts), used
// to exercise Studio's Ramadan-template auto-suggest.
const ramadanMonthly = {
  ...mockMonthly,
  month: 3,
  days: [
    mkDay("2026-03-01", 12, "Ramadan"),
    mkDay("2026-03-02", 13, "Ramadan"),
    mkDay("2026-03-03", 14, "Ramadan"),
  ],
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

/** The location search lives in the Place panel of the icon rail. */
function openPlace() {
  fireEvent.click(screen.getByRole("button", { name: "Place" }));
}

describe("Studio", () => {
  it("renders the location search input and the three format tabs", () => {
    render(<Studio />);
    openPlace();
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

  it("derives the method from the selected city until the user overrides it, then keeps the override on the next city selection", async () => {
    vi.mocked(defaultMethod).mockImplementation((country: string) =>
      country === "Bangladesh" ? "Karachi" : "MuslimWorldLeague",
    );
    vi.mocked(getMethods).mockResolvedValue([
      { id: "MuslimWorldLeague", name: "Muslim World League" },
      { id: "Karachi", name: "Karachi" },
      { id: "Egyptian", name: "Egyptian" },
    ]);
    // Both results resolve from a single debounced search fired automatically
    // for the default city query ("Dhaka") on mount. The results dropdown
    // only opens once the user has interacted with the field (see
    // LocationBar's `interactedRef` — it must not auto-open for the
    // prefilled city), so this focuses the field first; re-focusing it later
    // re-opens the already-fetched result list, letting the test select a
    // second, different city.
    vi.mocked(searchCity).mockResolvedValue([
      { name: "Dhaka", lat: 23.81, lon: 90.41, country: "Bangladesh" },
      { name: "Cairo", lat: 30.04, lon: 31.24, country: "Egypt" },
    ]);

    render(<Studio />);
    const main = screen.getByRole("main");
    openPlace();
    fireEvent.focus(screen.getByLabelText("Location"));

    // Selecting the first city (no override yet) derives the method from the
    // city's country via defaultMethod().
    await waitFor(() => expect(screen.getByText("Bangladesh")).toBeInTheDocument(), {
      timeout: 2000,
    });
    fireEvent.click(screen.getByText("Bangladesh").closest("button")!);
    await waitFor(() => expect(main).toHaveTextContent(/"method":\s*"Karachi"/));

    // Manually override the method in the Times panel.
    fireEvent.click(screen.getByRole("button", { name: "Times" }));
    await waitFor(() => expect(screen.getByLabelText("Calculation method")).toBeInTheDocument());
    fireEvent.click(screen.getByLabelText("Calculation method"));
    await waitFor(() => expect(screen.getByText("Egyptian")).toBeInTheDocument());
    const egyptianOption = screen.getByText("Egyptian").closest('[role="option"]')!;
    // base-ui's Select item only commits a mouse click preceded by a
    // pointerdown on the same element (it ignores "synthetic" clicks without
    // one, to avoid accidental selection while the popup opens under the
    // cursor).
    fireEvent.pointerDown(egyptianOption, { pointerType: "mouse" });
    fireEvent.click(egyptianOption);
    await waitFor(() => expect(main).toHaveTextContent(/"method":\s*"Egyptian"/));

    // Selecting a different city no longer resets the method: it stays the
    // overridden value even though defaultMethod("Egypt") would say
    // "MuslimWorldLeague". Back in the Place panel, focusing the input opens the list.
    openPlace();
    fireEvent.focus(screen.getByLabelText("Location"));
    await waitFor(() => expect(screen.getByText("Egypt")).toBeInTheDocument(), { timeout: 2000 });
    fireEvent.click(screen.getByText("Egypt").closest("button")!);
    await waitFor(() => expect(main).toHaveTextContent(/"city":\s*"Cairo"/));
    expect(main).toHaveTextContent(/"method":\s*"Egyptian"/);
    expect(main).not.toHaveTextContent(/"method":\s*"MuslimWorldLeague"/);
  });

  it("runs a debounced city search as the user types and shows results", async () => {
    // Regression guard: the search field must be a real text input (typing must
    // reach onChange), not a base-ui popover trigger that renders as a button.
    vi.mocked(searchCity).mockResolvedValue([
      { name: "Cairo", lat: 30.04, lon: 31.24, country: "Egypt" },
    ]);
    render(<Studio />);
    openPlace();
    const locationInput = screen.getByLabelText("Location");
    fireEvent.change(locationInput, { target: { value: "Cairo" } });
    expect((locationInput as HTMLInputElement).value).toBe("Cairo");
    await waitFor(() => expect(searchCity).toHaveBeenCalledWith("Cairo"));
    await waitFor(() => expect(screen.getByText("Cairo")).toBeInTheDocument());
  });

  it("keeps the design when the format changes", async () => {
    render(<Studio />);
    expect(screen.getByTestId("current-template")).toHaveTextContent("mihrab");
    fireEvent.click(screen.getByRole("tab", { name: "Monthly" }));
    await waitFor(() => expect(screen.getByRole("tab", { name: "Monthly" })).toHaveAttribute("aria-selected", "true"));
    expect(screen.getByTestId("current-template")).toHaveTextContent("mihrab");
  });

  it("switches design from the design strip", async () => {
    render(<Studio />);
    // Pick Parchment's first colour by its accessible title.
    const parchment = screen.getAllByRole("option").find((el) => el.getAttribute("title")?.startsWith("Parchment & Ink"));
    fireEvent.click(parchment!);
    await waitFor(() => expect(screen.getByTestId("current-template")).toHaveTextContent("parchment"));
  });

  it("opens an old shared link in the matching design with Masjid mode on", () => {
    window.history.replaceState(null, "", "/?template=monthly-masjid&format=monthly");
    render(<Studio />);
    expect(screen.getByTestId("current-template")).toHaveTextContent("mihrab");
    fireEvent.click(screen.getByRole("button", { name: "Designs" }));
    expect(screen.getByRole("switch", { name: /Masjid mode/ })).toBeChecked();
  });

  it("persists state to localStorage and the URL on state changes", async () => {
    const replaceStateSpy = vi.spyOn(window.history, "replaceState");
    const setItemSpy = vi.spyOn(Storage.prototype, "setItem");
    try {
      render(<Studio />);
      await waitFor(() => expect(replaceStateSpy).toHaveBeenCalled());
      replaceStateSpy.mockClear();
      setItemSpy.mockClear();

      fireEvent.click(screen.getByRole("tab", { name: "Monthly" }));

      await waitFor(() => {
        expect(replaceStateSpy).toHaveBeenCalled();
        expect(setItemSpy).toHaveBeenCalledWith(
          "awqat:state",
          expect.stringContaining('"format":"monthly"'),
        );
      });
    } finally {
      replaceStateSpy.mockRestore();
      setItemSpy.mockRestore();
    }
  });

  it("turns Ramadan mode on when a Ramadan-dominant month loads and the switch hasn't been touched", async () => {
    vi.mocked(getMonthly).mockResolvedValue(ramadanMonthly);
    render(<Studio />);
    expect(screen.getByTestId("ramadan-mode")).toHaveTextContent("false");

    fireEvent.click(screen.getByRole("tab", { name: "Monthly" }));

    await waitFor(() => {
      expect(screen.getByTestId("ramadan-mode")).toHaveTextContent("true");
    });
  });

  it("fetches all 12 months in parallel when the year format is selected", async () => {
    render(<Studio />);
    fireEvent.click(screen.getByRole("tab", { name: "Year" }));

    await waitFor(() => {
      const monthsRequested = new Set(
        vi.mocked(getMonthly).mock.calls.map((call) => call[0].month),
      );
      for (let month = 1; month <= 12; month++) {
        expect(monthsRequested).toContain(month);
      }
    });
  });

  it("refetches with the new month when the Date controls' Month select changes", async () => {
    const MONTH_NAMES = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    // Pick a target month guaranteed to differ from whatever month the
    // Studio initializes to (DEFAULT_STATE.month is the real current
    // month), so this assertion is meaningful regardless of run date.
    const currentMonth = new Date().getMonth() + 1;
    const targetMonth = currentMonth === 3 ? 5 : 3;
    const targetLabel = MONTH_NAMES[targetMonth - 1];

    render(<Studio />);
    await waitFor(() => expect(getMonthly).toHaveBeenCalled());

    // The Month select only shows for the monthly/year formats (daily uses a
    // calendar), inside the top bar's Date chip. Switch to Monthly first, let
    // its own format-change refetch settle, then clear the mock so the
    // assertion below sees only the month-change refetch.
    fireEvent.click(screen.getByRole("tab", { name: "Monthly" }));
    fireEvent.click(screen.getByRole("button", { name: "Date" }));
    await waitFor(() => expect(screen.getByLabelText("Month")).toBeInTheDocument());
    vi.mocked(getMonthly).mockClear();

    const monthTrigger = screen.getByLabelText("Month");
    fireEvent.click(monthTrigger);
    await waitFor(() => expect(screen.getByText(targetLabel)).toBeInTheDocument());
    const option = screen.getByText(targetLabel).closest('[role="option"]')!;
    // base-ui's Select item only commits a mouse click preceded by a
    // pointerdown on the same element (see the "Advanced" method-select test
    // above for the same pattern).
    fireEvent.pointerDown(option, { pointerType: "mouse" });
    fireEvent.click(option);

    await waitFor(() => {
      expect(getMonthly).toHaveBeenCalledWith(expect.objectContaining({ month: targetMonth }));
    });
  });

  it("does not auto-suggest Ramadan mode once the user has flipped the switch", async () => {
    vi.mocked(getMonthly).mockResolvedValue(ramadanMonthly);
    render(<Studio />);

    // Flip Ramadan mode on and back off by hand in the Designs panel.
    fireEvent.click(screen.getByRole("button", { name: "Designs" }));
    const ramadanSwitch = screen.getByRole("switch", { name: /Ramadan mode/ });
    fireEvent.click(ramadanSwitch);
    await waitFor(() => expect(screen.getByTestId("ramadan-mode")).toHaveTextContent("true"));
    fireEvent.click(ramadanSwitch);
    await waitFor(() => expect(screen.getByTestId("ramadan-mode")).toHaveTextContent("false"));

    fireEvent.click(screen.getByRole("tab", { name: "Monthly" }));
    // Give the auto-suggest effect a chance to (incorrectly) fire.
    await new Promise((resolve) => setTimeout(resolve, 80));
    expect(screen.getByTestId("ramadan-mode")).toHaveTextContent("false");
  });
});
