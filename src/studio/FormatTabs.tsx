import { useLayoutEffect, useRef, useState } from "react";
import type { StudioState } from "@/lib/state";
import { cn } from "@/lib/utils";
import { useStudio } from "./context";

const FORMATS: { value: StudioState["format"]; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "monthly", label: "Monthly" },
  { value: "year", label: "Year" },
];

/** Daily / Monthly / Year as a segmented switch with a sliding highlight. Designs keep their look across formats. */
export function FormatTabs({ className }: { className?: string } = {}) {
  const { state, updateState } = useStudio();
  const list = useRef<HTMLDivElement>(null);
  const [pill, setPill] = useState<{ left: number; width: number } | null>(null);

  useLayoutEffect(() => {
    const place = () => {
      const b = list.current?.querySelector<HTMLElement>('[aria-selected="true"]');
      if (b) setPill({ left: b.offsetLeft, width: b.offsetWidth });
    };
    place();
    if (typeof ResizeObserver === "undefined" || !list.current) return;
    const ro = new ResizeObserver(place);
    ro.observe(list.current);
    return () => ro.disconnect();
  }, [state.format]);

  const move = (dir: 1 | -1) => {
    const i = FORMATS.findIndex((f) => f.value === state.format);
    const next = FORMATS[(i + dir + FORMATS.length) % FORMATS.length];
    updateState({ format: next.value });
    requestAnimationFrame(() => list.current?.querySelector<HTMLElement>('[aria-selected="true"]')?.focus());
  };

  return (
    <div
      ref={list}
      role="tablist"
      aria-label="Format"
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") move(1);
        if (e.key === "ArrowLeft") move(-1);
      }}
      className={cn("relative flex rounded-xl bg-[#ece5d6] p-1", className)}
    >
      {pill && (
        <span
          aria-hidden="true"
          className="absolute top-1 bottom-1 rounded-[9px] bg-card shadow-[0_1px_2px_rgba(60,45,10,.12),0_0_0_1px_var(--border)] transition-[left,width] duration-200 ease-out motion-reduce:transition-none"
          style={{ left: pill.left, width: pill.width }}
        />
      )}
      {FORMATS.map((f) => {
        const on = f.value === state.format;
        return (
          <button
            key={f.value}
            type="button"
            role="tab"
            aria-selected={on}
            tabIndex={on ? 0 : -1}
            onClick={() => updateState({ format: f.value })}
            className={cn(
              "relative z-10 flex h-9 flex-1 cursor-pointer items-center justify-center rounded-[9px] px-4 text-sm font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
              on ? "text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {f.label}
          </button>
        );
      })}
    </div>
  );
}

export default FormatTabs;
