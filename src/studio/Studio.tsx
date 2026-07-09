import { useCallback, useEffect, useMemo, useState } from "react";
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
import { specialDaysForMonth, type SpecialType } from "@/lib/calendar";
import { LocationBar } from "./LocationBar";
import { FormatTabs } from "./FormatTabs";
import { PreviewStage } from "./PreviewStage";
import { TemplateGallery } from "./TemplateGallery";
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
};

export function Studio() {
  const [state, setState] = useState<StudioState>(() => computeInitialState());
  const [methodOverridden, setMethodOverridden] = useState(false);
  const [fetchState, setFetchState] = useState<FetchState>(INITIAL_FETCH_STATE);

  const updateState = useCallback((patch: Partial<StudioState>) => {
    setState((prev) => withValidTemplate({ ...prev, ...patch }));
  }, []);

  // Persist to localStorage + reflect into the URL on every state change.
  useEffect(() => {
    saveLocal(state);
    const qs = encodeState(state);
    const next = qs ? `?${qs}` : window.location.pathname;
    window.history.replaceState(null, "", next);
  }, [state]);

  // Defensive guard: `updateState` and `FormatTabs.changeFormat` already keep
  // `template` valid for the current `format` on every path that changes
  // either value, but this re-validates on every format change in case some
  // future code path ever sets `format` directly without going through them.
  useEffect(() => {
    setState((prev) => withValidTemplate(prev));
  }, [state.format]);

  const month = useMemo(() => new Date().getMonth() + 1, []);

  useEffect(() => {
    let cancelled = false;
    setFetchState((s) => ({ ...s, loading: true, error: null }));

    Promise.all([
      getMonthly({
        lat: state.lat,
        lon: state.lon,
        year: state.year,
        month,
        method: state.method,
        madhab: state.madhab,
      }),
      getQibla({ lat: state.lat, lon: state.lon }),
      getCountdowns({ lat: state.lat, lon: state.lon, year: state.year }),
    ])
      .then(([monthly, qibla, countdowns]) => {
        if (cancelled) return;
        setFetchState({
          monthly,
          qibla,
          countdowns,
          specialDays: specialDaysForMonth(monthly.days),
          loading: false,
          error: null,
        });
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
    // Year format defers the full 12-month fetch to Task 12; for now every
    // format just fetches the current month so the studio has real data to
    // prove the wiring works.
  }, [state.lat, state.lon, state.year, month, state.method, state.madhab, state.format]);

  const ctxValue: StudioContextValue = useMemo(
    () => ({ state, updateState, methodOverridden, setMethodOverridden }),
    [state, updateState, methodOverridden],
  );

  return (
    <StudioContext.Provider value={ctxValue}>
      <div className="flex h-svh flex-col bg-background text-foreground">
        <div className="flex flex-1 overflow-hidden">
          <aside className="flex w-80 shrink-0 flex-col gap-4 overflow-y-auto border-r border-border bg-sidebar p-4">
            <div>
              <h1 className="text-lg font-semibold text-sidebar-foreground">Awqat Studio</h1>
              <p className="text-xs text-muted-foreground">
                Design a prayer-time chart in minutes.
              </p>
            </div>

            <LocationBar />
            <FormatTabs />

            <div className="flex flex-1 flex-col overflow-y-auto">
              <TemplateGallery />
            </div>
          </aside>

          <main
            id="preview-region"
            className="relative flex flex-1 overflow-hidden bg-muted/30"
          >
            {/* Test-support seam (see tests/studio.test.tsx): several existing
                tests assert on the current template id and on a JSON-ish dump
                of city/method/format/template independent of PreviewStage's
                own rendering/loading state, so these stay visually hidden but
                always present regardless of fetch state. */}
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
              loading={fetchState.loading}
              error={fetchState.error}
            />
          </main>

          <aside className="w-72 shrink-0 overflow-y-auto border-l border-border p-4 text-xs text-muted-foreground">
            Customize panel lands in Task 14.
          </aside>
        </div>

        <footer className="flex h-14 shrink-0 items-center border-t border-border px-4 text-xs text-muted-foreground">
          Export bar lands in Task 16.
        </footer>
      </div>
    </StudioContext.Provider>
  );
}

export default Studio;
