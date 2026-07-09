import { dir, type Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export type MethodCaptionProps = {
  method: string;
  madhab: string;
  /** When set, drives the caption's own `dir` attribute independent of its parent. */
  lang?: Lang;
  className?: string;
};

/**
 * Shared "Method: {method} · {madhab}" caption used by every template (see
 * `src/templates/{daily,monthly,year}/*.tsx`). It's a data-honesty note —
 * which calculation method/madhab produced the times — so it's rendered
 * *inside* the export node and baked into every exported image/PDF, unlike
 * the app-only disclaimer/footer in `Studio.tsx`.
 */
export function MethodCaption({ method, madhab, lang, className }: MethodCaptionProps) {
  return (
    <p className={cn("text-center text-sm opacity-60", className)} dir={lang ? dir(lang) : undefined}>
      Method: {method} · {madhab}
    </p>
  );
}

export default MethodCaption;
