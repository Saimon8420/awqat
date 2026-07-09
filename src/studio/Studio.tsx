import { createContext, useContext, useEffect, useMemo, useState } from "react";
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

export type StudioContextValue = {
  state: StudioState;
  updateState: (patch: Partial<StudioState>) => void;
  methodOverridden: boolean;
  setMethodOverridden: (v: boolean) => void;
};

const StudioContext = createContext<StudioContextValue | null>(null);

export function useStudio(): StudioContextValue {
  const ctx = useContext(StudioContext);
  if (!ctx) throw new Error("useStudio must be used within <Studio/>");
  return ctx;
}

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
  loading: false,
  error: null,
};

export function Studio() {
  const [state, setState] = useState<StudioState>(() => computeInitialState());
  const [methodOverridden, setMethodOverridden] = useState(false);
  const [fetchState, setFetchState] = useState<FetchState>(INITIAL_FETCH_STATE);

  function updateState(patch: Partial<StudioState>) {
    setState((prev) => withValidTemplate({ ...prev, ...patch }));
  }

  // Persist to localStorage + reflect into the URL on every state change.
  useEffect(() => {
    saveLocal(state);
    const qs = encodeState(state);
    const next = qs ? `?${qs}` : window.location.pathname;
    window.history.replaceState(null, "", next);
  }, [state]);

  // Safety net: whenever the format changes, guarantee the template stays valid.
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
    [state, methodOverridden],
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

            <div className="flex flex-1 flex-col items-center justify-center rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
              Template gallery lands in Task 11.
            </div>
          </aside>

          <main
            id="preview-region"
            className="flex flex-1 items-start justify-center overflow-auto bg-muted/30 p-6"
          >
            <div className="w-full max-w-xl rounded-lg border border-border bg-card p-4 text-sm text-card-foreground shadow-sm">
              <h2 className="mb-2 font-medium">Fetched data (temporary preview)</h2>
              <p className="mb-3 text-xs text-muted-foreground">
                Real PreviewStage rendering lands in Task 10 — this JSON dump proves the data
                pipeline works end to end.
              </p>
              {fetchState.loading && (
                <p className="text-muted-foreground" role="status">
                  Loading prayer times…
                </p>
              )}
              {fetchState.error && (
                <p className="text-destructive" role="alert">
                  Error: {fetchState.error}
                </p>
              )}
              {!fetchState.loading && !fetchState.error && (
                <pre className="max-h-96 overflow-auto whitespace-pre-wrap text-xs">
                  {JSON.stringify(
                    {
                      city: state.city,
                      lat: state.lat,
                      lon: state.lon,
                      format: state.format,
                      template: state.template,
                      method: state.method,
                      madhab: state.madhab,
                      monthDayCount: fetchState.monthly?.days.length ?? 0,
                      qibla: fetchState.qibla,
                      countdowns: fetchState.countdowns,
                      specialDayCount: Object.keys(fetchState.specialDays).length,
                    },
                    null,
                    2,
                  )}
                </pre>
              )}
            </div>
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
