import { createContext, useContext } from "react";
import type { StudioState } from "@/lib/state";

export type StudioContextValue = {
  state: StudioState;
  updateState: (patch: Partial<StudioState>) => void;
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
};

export const StudioContext = createContext<StudioContextValue | null>(null);

export function useStudio(): StudioContextValue {
  const ctx = useContext(StudioContext);
  if (!ctx) throw new Error("useStudio must be used within <Studio/>");
  return ctx;
}
