import { createContext, useContext } from "react";
import type { StudioState } from "@/lib/state";

/**
 * A state update: either a plain patch merged over the current state, or a
 * function of the *latest* state returning that patch. The functional form is
 * what keeps concurrent nested edits correct — e.g. two debounced personalize
 * fields whose timers fire back-to-back each read the freshest `personal`/`org`
 * object instead of a stale render-time snapshot that would clobber the other.
 */
export type StatePatch =
  | Partial<StudioState>
  | ((prev: StudioState) => Partial<StudioState>);

export type StudioContextValue = {
  state: StudioState;
  updateState: (patch: StatePatch) => void;
  methodOverridden: boolean;
  setMethodOverridden: (v: boolean) => void;
  /**
   * Marks that the user has explicitly picked a template this session (via
   * TemplateGallery), as opposed to a template being set automatically
   * (format-fallback, or the Ramadan auto-suggest in Studio). Call this
   * alongside `updateState({ template })` from any *manual* template pick
   * so the Ramadan auto-suggest knows not to override the user's choice.
   */
  setTemplateTouched: (v: boolean) => void;
  /**
   * True while the export pipeline (Task 16) is capturing `#export-node`
   * (e.g. via html-to-image). Defaults to false. Consumers that render
   * moment-in-time UI near the preview — currently `LiveCountdown` via
   * `PreviewStage` — read this to freeze themselves during capture.
   */
  exporting: boolean;
  setExporting: (v: boolean) => void;
};

export const StudioContext = createContext<StudioContextValue | null>(null);

export function useStudio(): StudioContextValue {
  const ctx = useContext(StudioContext);
  if (!ctx) throw new Error("useStudio must be used within <Studio/>");
  return ctx;
}
