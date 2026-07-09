import { createContext, useContext } from "react";
import type { StudioState } from "@/lib/state";

export type StudioContextValue = {
  state: StudioState;
  updateState: (patch: Partial<StudioState>) => void;
  methodOverridden: boolean;
  setMethodOverridden: (v: boolean) => void;
};

export const StudioContext = createContext<StudioContextValue | null>(null);

export function useStudio(): StudioContextValue {
  const ctx = useContext(StudioContext);
  if (!ctx) throw new Error("useStudio must be used within <Studio/>");
  return ctx;
}
