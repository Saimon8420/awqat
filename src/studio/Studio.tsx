import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  initialState,
  encodeState,
  loadLocal,
  migrateState,
  saveLocal,
  type StudioState,
} from "@/lib/state";
import {
  getCountdowns,
  getMonthly,
  getQibla,
  type Countdowns,
  type MonthlyResponse,
  type QiblaData,
} from "@/lib/miqaat";
import { isRamadanMonth, specialDaysForMonth, type SpecialType } from "@/lib/calendar";
import { adjustHijri } from "@/lib/hijri-adjust";
import { dir } from "@/lib/i18n";
import { useIsMobile } from "@/lib/use-media-query";
import { MobileStudio } from "./MobileStudio";
import { DesktopStudio } from "./DesktopStudio";
import { PreviewStage } from "./PreviewStage";
import { StudioContext, type StudioContextValue } from "./context";

function computeInitialState(): StudioState {
  const merged = initialState(loadLocal(), window.location.search);
  // Maps pre-redesign template ids and keeps the colour valid for the design.
  return migrateState(merged);
}

type FetchState = {
  monthly: MonthlyResponse | null;
  qibla: QiblaData | null;
  countdowns: Countdowns | null;
  specialDays: Record<string, SpecialType[]>;
  loading: boolean;
  error: string | null;
  /**
   * All 12 months of `state.year` (Jan..Dec, index 0..11), fetched only
   * while `state.format === "year"` by the dedicated effect below. `null`
   * until that fetch resolves (or when the year format isn't active).
   */
  months: MonthlyResponse[] | null;
};

const INITIAL_FETCH_STATE: FetchState = {
  monthly: null,
  qibla: null,
  countdowns: null,
  specialDays: {},
  // A fetch always fires on mount, so start in the loading state to avoid a
  // one-render flash of empty data before the loading indicator appears.
  loading: true,
  error: null,
  months: null,
};

export function Studio() {
  // Below `lg` the app switches to a purpose-built phone shell (see
  // MobileStudio) rather than stacking the desktop columns; the two share all
  // state and every controls component.
  const isMobile = useIsMobile();
  const [state, setState] = useState<StudioState>(() => computeInitialState());
  const [methodOverridden, setMethodOverridden] = useState(false);
  const [fetchState, setFetchState] = useState<FetchState>(INITIAL_FETCH_STATE);
  // Whether the user has flipped the Ramadan switch this session. Gates the
  // Ramadan auto-suggest below so it never overrides a manual choice.
  const [ramadanTouched, setRamadanTouched] = useState(false);
  const [zoom, setZoom] = useState(1);
  // Export-capture flag (see StudioContextValue.exporting): Task 16's export
  // pipeline flips this true around the html-to-image capture of
  // #export-node so any moment-in-time UI (currently LiveCountdown) can
  // freeze itself. Lives in context rather than a threaded prop so any
  // future consumer can opt in without a new prop chain.
  const [exporting, setExporting] = useState(false);
  // Dedup key ("year-month") for the last month the Ramadan auto-suggest
  // fired for, so it runs at most once per fetched month rather than on
  // every re-render.
  const ramadanSuggestedForRef = useRef<string | null>(null);

  const updateState = useCallback<StudioContextValue["updateState"]>((patch) => {
    setState((prev) => {
      const resolved = typeof patch === "function" ? patch(prev) : patch;
      return migrateState({ ...prev, ...resolved });
    });
  }, []);

  // Persist to localStorage + reflect into the URL — but debounced. Continuous
  // inputs (dragging the color picker or a slider) fire state changes many
  // times a second; writing state (which can include a large `bgImage` data
  // URI) to localStorage + `history.replaceState` on every tick janks the drag.
  // Coalescing to the last change after a short idle keeps interaction smooth
  // while still persisting promptly once the user settles.
  const persistTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (persistTimer.current) clearTimeout(persistTimer.current);
    persistTimer.current = setTimeout(() => {
      saveLocal(state);
      const qs = encodeState(state);
      const next = qs ? `?${qs}` : window.location.pathname;
      window.history.replaceState(null, "", next);
    }, 200);
    return () => {
      if (persistTimer.current) clearTimeout(persistTimer.current);
    };
  }, [state]);

  // A new format starts at fit-to-screen.
  useEffect(() => {
    setZoom(1);
  }, [state.format, state.exportRatio, state.orientation]);

  useEffect(() => {
    let cancelled = false;
    setFetchState((s) => ({ ...s, loading: true, error: null }));

    Promise.all([
      getMonthly({
        lat: state.lat,
        lon: state.lon,
        year: state.year,
        month: state.month,
        method: state.method,
        madhab: state.madhab,
      }),
      getQibla({ lat: state.lat, lon: state.lon }),
      getCountdowns({ lat: state.lat, lon: state.lon, year: state.year, adjustment: state.hijriAdjust }),
    ])
      .then(([monthly, qibla, countdowns]) => {
        if (cancelled) return;
        setFetchState((s) => ({
          ...s,
          monthly,
          qibla,
          countdowns,
          loading: false,
          error: null,
        }));
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setFetchState((s) => ({
          ...s,
          loading: false,
          error: err instanceof Error ? err.message : String(err),
        }));
      });

    return () => {
      cancelled = true;
    };
    // Every format (including "year") fetches the selected month here so
    // `monthly`/`qibla`/`countdowns` are always populated for TemplateProps;
    // the year format's full 12-month grid is fetched separately below.
  }, [state.lat, state.lon, state.year, state.month, state.method, state.madhab, state.format, state.hijriAdjust]);

  // Year format: fetch all 12 months of state.year in parallel for the
  // year-overview poster's per-month panels. getMonthly caches per
  // (lat,lon,year,month,method,madhab), so revisiting the year format (or
  // re-running this effect after an unrelated dep change) is cheap. Uses its
  // own `cancelled` guard, independent of the effect above, so a location
  // change mid-flight can't let a stale 12-month result overwrite newer data.
  useEffect(() => {
    if (state.format !== "year") return;

    let cancelled = false;
    setFetchState((s) => ({ ...s, loading: true, error: null }));

    Promise.all(
      Array.from({ length: 12 }, (_, i) =>
        getMonthly({
          lat: state.lat,
          lon: state.lon,
          year: state.year,
          month: i + 1,
          method: state.method,
          madhab: state.madhab,
        }),
      ),
    )
      .then((months) => {
        if (cancelled) return;
        setFetchState((s) => ({ ...s, months, loading: false, error: null }));
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setFetchState((s) => ({
          ...s,
          loading: false,
          error: err instanceof Error ? err.message : String(err),
        }));
      });

    return () => {
      cancelled = true;
    };
  }, [state.lat, state.lon, state.year, state.method, state.madhab, state.format]);

  // The fetched months with the user's Hijri adjustment applied. Changing the
  // adjustment re-derives these without refetching.
  const shift = state.hijriAdjust;
  const monthly = useMemo(() => (fetchState.monthly ? adjustHijri(fetchState.monthly, shift) : null), [fetchState.monthly, shift]);
  const months = useMemo(() => fetchState.months?.map((m) => adjustHijri(m, shift)) ?? null, [fetchState.months, shift]);
  const specialDays = useMemo(() => (monthly ? specialDaysForMonth(monthly.days) : {}), [monthly]);

  // Auto-suggest Ramadan mode: once per fetched month, if the month is
  // Ramadan-dominant and the user hasn't flipped the switch themselves, turn
  // it on — but only while viewing the monthly format. Gated by
  // `ramadanSuggestedForRef` so it fires at most once per month-load.
  useEffect(() => {
    if (!monthly) return;
    if (state.format !== "monthly") return;
    if (ramadanTouched) return;

    const monthKey = `${monthly.year}-${monthly.month}`;
    if (ramadanSuggestedForRef.current === monthKey) return;
    if (!isRamadanMonth(monthly.days)) return;

    ramadanSuggestedForRef.current = monthKey;
    setState((prev) => (prev.ramadan ? prev : { ...prev, ramadan: true }));
  }, [monthly, state.format, ramadanTouched]);

  const ctxValue: StudioContextValue = useMemo(
    () => ({
      state,
      updateState,
      methodOverridden,
      setMethodOverridden,
      setRamadanTouched,
      exporting,
      setExporting,
      zoom,
      setZoom,
      monthly: monthly,
    }),
    [state, updateState, methodOverridden, exporting, zoom, monthly],
  );

  // The preview is built once and handed to whichever shell is active, so
  // there's only ever one `#export-node` in the document for the exporters to
  // find (see ExportBar).
  const preview = (
    <div lang={state.lang} dir={dir(state.lang)} className="flex h-full w-full">
      {/* Test-support seam (see tests/studio.test.tsx): several existing
          tests assert on the current template id and on a JSON-ish dump of
          city/method/format/template independent of PreviewStage's own
          rendering/loading state, so these stay visually hidden but always
          present regardless of fetch state. */}
      <span className="sr-only" data-testid="current-template">
        {state.template}
      </span>
      <span className="sr-only" data-testid="ramadan-mode">
        {String(state.ramadan)}
      </span>
      <pre className="sr-only">
        {JSON.stringify({
          city: state.city,
          method: state.method,
          format: state.format,
          template: state.template,
        })}
      </pre>

      <PreviewStage
        monthly={monthly}
        qibla={fetchState.qibla}
        countdowns={fetchState.countdowns}
        specialDays={specialDays}
        months={months}
        loading={fetchState.loading}
        error={fetchState.error}
      />
    </div>
  );

  if (isMobile) {
    return (
      <StudioContext.Provider value={ctxValue}>
        <MobileStudio>{preview}</MobileStudio>
      </StudioContext.Provider>
    );
  }

  return (
    <StudioContext.Provider value={ctxValue}>
      <DesktopStudio>{preview}</DesktopStudio>
    </StudioContext.Provider>
  );
}

export default Studio;
