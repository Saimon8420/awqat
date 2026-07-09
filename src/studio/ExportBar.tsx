import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { exportPng } from "@/lib/export";
import type { StudioState } from "@/lib/state";
import { useStudio } from "./context";

const RATIOS: { value: NonNullable<StudioState["exportRatio"]>; label: string }[] = [
  { value: "story", label: "Story 9:16" },
  { value: "square", label: "Square 1:1" },
  { value: "post", label: "Post 4:5" },
];

// PNG capture width per format, in pixels — passed as `targetWidth` to
// `exportPng`/`exportScale`. Daily's three ratios (see RATIOS above) all
// share a 1080px canvas width, so one value covers all of them; year's A3
// landscape canvas is wider (1587px) and doesn't participate in the ratio
// toggle at all.
const TARGET_WIDTH: Record<StudioState["format"], number> = {
  daily: 1080,
  monthly: 1080,
  year: 1587,
};

function slugify(value: string): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "export"
  );
}

/**
 * Bottom bar of the Studio: lets the user pick an export aspect ratio for
 * the `daily` format (Story/Square/Post — see `PreviewStage`'s
 * `DAILY_RATIO_SIZE`) and triggers the `#export-node` PNG capture.
 *
 * The ratio toggle is disabled for `monthly`/`year`, which always use their
 * own fixed canvas size (portrait poster / A3 landscape respectively).
 */
export function ExportBar() {
  const { state, updateState, setExporting } = useStudio();
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ratioEnabled = state.format === "daily";

  async function handleDownload() {
    setError(null);
    setDownloading(true);
    // Freeze moment-in-time chrome (currently LiveCountdown) before capture.
    setExporting(true);
    try {
      // Give React a paint cycle to apply the `exporting`-driven freeze (and
      // any resulting re-render) before html-to-image serializes the node.
      await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));

      const node = document.getElementById("export-node");
      if (!node) throw new Error("Nothing to export yet — the preview hasn't rendered.");

      const filename = `awqat-${state.format}-${slugify(state.city)}.png`;
      await exportPng(node, { targetWidth: TARGET_WIDTH[state.format], filename });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setExporting(false);
      setDownloading(false);
    }
  }

  return (
    <footer className="flex h-14 shrink-0 items-center justify-between gap-4 border-t border-border px-4">
      <div className="flex items-center gap-1.5">
        <span className="mr-1 text-xs text-muted-foreground">Aspect ratio</span>
        {RATIOS.map((r) => (
          <Button
            key={r.value}
            type="button"
            size="sm"
            variant={ratioEnabled && (state.exportRatio ?? "story") === r.value ? "default" : "outline"}
            disabled={!ratioEnabled}
            aria-pressed={ratioEnabled && (state.exportRatio ?? "story") === r.value}
            onClick={() => updateState({ exportRatio: r.value })}
          >
            {r.label}
          </Button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        {error && (
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}
        <Button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className={cn(downloading && "opacity-80")}
        >
          {downloading ? "Exporting…" : "Download PNG"}
        </Button>
      </div>
    </footer>
  );
}

export default ExportBar;
