import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Studio } from "../src/studio/Studio";
import { getCountdowns, getMethods, getMonthly, getQibla } from "../src/lib/miqaat";
import { searchCity, defaultMethod } from "../src/lib/geo";
import { templatesFor } from "../src/templates/registry";

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
    // for the default city query ("Dhaka") on mount. Re-focusing the input
    // re-opens the already-fetched result list, letting the test select a
    // second, different city.
    vi.mocked(searchCity).mockResolvedValue([
      { name: "Dhaka", lat: 23.81, lon: 90.41, country: "Bangladesh" },
      { name: "Cairo", lat: 30.04, lon: 31.24, country: "Egypt" },
    ]);

    render(<Studio />);
    const main = screen.getByRole("main");
    const locationInput = screen.getByLabelText("Location");

    // Selecting the first city (no override yet) derives the method from the
    // city's country via defaultMethod().
    await waitFor(() => expect(screen.getByText("Bangladesh")).toBeInTheDocument(), {
      timeout: 2000,
    });
    fireEvent.click(screen.getByText("Bangladesh").closest("button")!);
    await waitFor(() => expect(main).toHaveTextContent(/"method":\s*"Karachi"/));

    // Manually override the method via the Advanced select.
    fireEvent.click(screen.getByRole("button", { name: "Advanced" }));
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
    // Close the Advanced popover so it doesn't shadow the rest of the page.
    fireEvent.click(screen.getByRole("button", { name: "Advanced" }));

    // Selecting a different city no longer resets the method: it stays the
    // overridden value even though defaultMethod("Egypt") would say
    // "MuslimWorldLeague". Focusing the input re-opens the already-fetched list.
    fireEvent.focus(locationInput);
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
    const locationInput = screen.getByLabelText("Location");
    fireEvent.change(locationInput, { target: { value: "Cairo" } });
    expect((locationInput as HTMLInputElement).value).toBe("Cairo");
    await waitFor(() => expect(searchCity).toHaveBeenCalledWith("Cairo"));
    await waitFor(() => expect(screen.getByText("Cairo")).toBeInTheDocument());
  });

  it("falls back to a valid template id when the format changes", async () => {
    render(<Studio />);
    const monthlyIds = templatesFor("monthly").map((t) => t.id);

    expect(screen.getByTestId("current-template")).not.toHaveTextContent(
      new RegExp(`^(${monthlyIds.join("|")})$`),
    );

    fireEvent.click(screen.getByRole("tab", { name: "Monthly" }));

    await waitFor(() => {
      expect(monthlyIds).toContain(screen.getByTestId("current-template").textContent);
    });
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
});
