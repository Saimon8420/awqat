import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  DEFAULT_STATE,
  decodeState,
  encodeState,
  loadLocal,
  saveLocal,
  type StudioState,
} from "@/lib/state";
import { templatesFor } from "@/templates/registry";
import {
  getCountdowns,
  getMonthly,
  getQibla,
  type Countdowns,
  type MonthlyResponse,
  type QiblaData,
} from "@/lib/miqaat";
import { isRamadanMonth, specialDaysForMonth, type SpecialType } from "@/lib/calendar";
import { dir } from "@/lib/i18n";
import { useIsMobile } from "@/lib/use-media-query";
import { Brand } from "./Brand";
import { MobileStudio } from "./MobileStudio";
import { DisclaimerText, ToolkitLinks } from "./SiteNotes";
import { LocationBar } from "./LocationBar";
import { FormatTabs } from "./FormatTabs";
import { DateControls } from "./DateControls";
import { PreviewStage } from "./PreviewStage";
import { TemplateGallery } from "./TemplateGallery";
import { CustomizePanel } from "./CustomizePanel";
import { ExportBar } from "./ExportBar";
import { StudioContext, type StudioContextValue } from "./context";

/** Ensures `template` is a valid id for `format`, falling back to the first template for that format. */
function withValidTemplate(s: StudioState): StudioState {
  const options = templatesFor(s.format);
  if (options.some((t) => t.id === s.template)) return s;
  return options.length > 0 ? { ...s, template: options[0].id } : s;
}

function computeInitialState(): StudioState {
  const fromLocal = loadLocal();
  const fromUrl = decodeState(window.location.search);
  const merged: StudioState = { ...DEFAULT_STATE, ...(fromLocal ?? {}), ...fromUrl };
  return withValidTemplate(merged);
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
  // Whether the user has explicitly picked a template this session (see
  // StudioContextValue.setTemplateTouched / TemplateGallery). Gates the
  // Ramadan auto-suggest below so it never overrides a manual choice.
  const [templateTouched, setTemplateTouched] = useState(false);
  // Export-capture flag (see StudioContextValue.exporting): Task 16's export
  // pipeline flips this true around the html-to-image capture of
  // #export-node so any moment-in-time UI (currently LiveCountdown) can
  // freeze itself. Lives in context rather than a threaded prop so any
  // future consumer can opt in without a new prop chain.
  const [exporting, setExporting] = useState(false);
  // Dedup key ("year-month") for the last month the Ramadan auto-suggest
  // fired for, so it runs at most once per fetched month rather than on
  // every re-render (which would otherwise fight a subsequent manual
  // template change back to `monthly-ramadan`).
  const ramadanSuggestedForRef = useRef<string | null>(null);

  const updateState = useCallback((patch: Partial<StudioState>) => {
    setState((prev) => withValidTemplate({ ...prev, ...patch }));
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

  // Defensive guard: `updateState` and `FormatTabs.changeFormat` already keep
  // `template` valid for the current `format` on every path that changes
  // either value, but this re-validates on every format change in case some
  // future code path ever sets `format` directly without going through them.
  useEffect(() => {
    setState((prev) => withValidTemplate(prev));
  }, [state.format]);

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
      getCountdowns({ lat: state.lat, lon: state.lon, year: state.year }),
    ])
      .then(([monthly, qibla, countdowns]) => {
        if (cancelled) return;
        setFetchState((s) => ({
          ...s,
          monthly,
          qibla,
          countdowns,
          specialDays: specialDaysForMonth(monthly.days),
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
  }, [state.lat, state.lon, state.year, state.month, state.method, state.madhab, state.format]);

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

  // Auto-suggest the Ramadan template: once per fetched month, if the month
  // is Ramadan-dominant and the user hasn't manually picked a template this
  // session, default to `monthly-ramadan` — but only while viewing the
  // monthly format (switching format doesn't discard the suggestion; it
  // just doesn't apply while looking at daily/year). Gated by
  // `ramadanSuggestedForRef` so this fires at most once per month-load: the
  // `setState` call below changes `state.template`, which is itself a
  // dependency of this effect, but the ref check short-circuits the re-run
  // instead of looping.
  useEffect(() => {
    const monthly = fetchState.monthly;
    if (!monthly) return;
    if (state.format !== "monthly") return;
    if (templateTouched) return;

    const monthKey = `${monthly.year}-${monthly.month}`;
    if (ramadanSuggestedForRef.current === monthKey) return;

    if (!isRamadanMonth(monthly.days)) return;

    ramadanSuggestedForRef.current = monthKey;
    if (state.template !== "monthly-ramadan") {
      setState((prev) => withValidTemplate({ ...prev, template: "monthly-ramadan" }));
    }
  }, [fetchState.monthly, state.format, state.template, templateTouched]);

  const ctxValue: StudioContextValue = useMemo(
    () => ({
      state,
      updateState,
      methodOverridden,
      setMethodOverridden,
      setTemplateTouched,
      exporting,
      setExporting,
    }),
    [state, updateState, methodOverridden, exporting],
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
      <pre className="sr-only">
        {JSON.stringify({
          city: state.city,
          method: state.method,
          format: state.format,
          template: state.template,
        })}
      </pre>

      <PreviewStage
        monthly={fetchState.monthly}
        qibla={fetchState.qibla}
        countdowns={fetchState.countdowns}
        specialDays={fetchState.specialDays}
        months={fetchState.months}
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
      <div className="flex h-svh flex-col overflow-x-hidden bg-background text-foreground">
        <div className="flex flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
          <aside className="relative flex w-full shrink-0 flex-col gap-4 overflow-y-auto border-b border-border bg-sidebar p-4 lg:w-80 lg:border-b-0 lg:border-r">
            <Brand />

            <LocationBar />
            <FormatTabs />
            <DateControls />

            <div className="flex flex-1 flex-col overflow-y-auto">
              <TemplateGallery />
            </div>
          </aside>

          <main id="preview-region" className="relative flex min-h-0 flex-1 overflow-hidden bg-muted/30">
            {preview}
          </main>

          <aside className="relative w-full shrink-0 overflow-y-auto border-t border-border p-4 lg:w-72 lg:border-t-0 lg:border-l">
            <CustomizePanel />
          </aside>
        </div>

        <ExportBar />

        <div className="flex shrink-0 flex-col gap-1.5 border-t border-border bg-muted/20 px-4 py-2.5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <DisclaimerText className="max-w-prose" />
          <ToolkitLinks className="shrink-0" />
        </div>
      </div>
    </StudioContext.Provider>
  );
}

export default Studio;
