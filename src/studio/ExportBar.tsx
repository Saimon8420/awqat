import { useState } from "react";
import { createRoot } from "react-dom/client";
import { toBlob } from "html-to-image";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { exportPdf, exportPng, exportYearZip } from "@/lib/export";
import { getMonthly } from "@/lib/miqaat";
import { specialDaysForMonth } from "@/lib/calendar";
import { TEMPLATES, templatesFor } from "@/templates/registry";
import { THEMES } from "@/templates/themes";
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

const PDF_SIZES: { value: "a4" | "a3"; label: string }[] = [
  { value: "a4", label: "A4" },
  { value: "a3", label: "A3" },
];

const PDF_ORIENTATIONS: { value: "portrait" | "landscape"; label: string }[] = [
  { value: "portrait", label: "Portrait" },
  { value: "landscape", label: "Landscape" },
];

// Sensible per-format PDF defaults (size + orientation) a user can still
// override via the toggles below: monthly's portrait poster fits A4
// portrait; year's landscape A3 canvas fits A3 landscape.
const PDF_DEFAULTS: Record<
  StudioState["format"],
  { size: "a4" | "a3"; orientation: "portrait" | "landscape" }
> = {
  daily: { size: "a4", orientation: "portrait" },
  monthly: { size: "a4", orientation: "portrait" },
  year: { size: "a3", orientation: "landscape" },
};

// Offscreen container size used by "Download all 12 months" to render each
// month with the same intrinsic pixel size as PreviewStage's monthly
// export-node (see `PreviewStage`'s `intrinsicSizeFor`).
const ALL_MONTHS_NODE_SIZE = { width: 1080, height: 1350 };

/**
 * Bottom bar of the Studio: lets the user pick an export aspect ratio for
 * the `daily` format (Story/Square/Post — see `PreviewStage`'s
 * `DAILY_RATIO_SIZE`), a PDF page size/orientation, and triggers PNG/PDF
 * captures of `#export-node` plus a "Download all 12 months" zip.
 *
 * The ratio toggle is disabled for `monthly`/`year`, which always use their
 * own fixed canvas size (portrait poster / A3 landscape respectively).
 */
export function ExportBar() {
  const { state, updateState, setExporting } = useStudio();
  const [downloading, setDownloading] = useState(false);
  const [pdfDownloading, setPdfDownloading] = useState(false);
  const [zipDownloading, setZipDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Per-format overrides for the PDF size/orientation toggles, keyed by
  // `state.format` so switching format falls back to that format's sensible
  // default (PDF_DEFAULTS) instead of carrying over an unrelated override.
  const [pdfSizeOverride, setPdfSizeOverride] = useState<
    Partial<Record<StudioState["format"], "a4" | "a3">>
  >({});
  const [pdfOrientationOverride, setPdfOrientationOverride] = useState<
    Partial<Record<StudioState["format"], "portrait" | "landscape">>
  >({});

  const ratioEnabled = state.format === "daily";
  const busy = downloading || pdfDownloading || zipDownloading;
  const pdfSize = pdfSizeOverride[state.format] ?? PDF_DEFAULTS[state.format].size;
  const pdfOrientation =
    pdfOrientationOverride[state.format] ?? PDF_DEFAULTS[state.format].orientation;
  const showAllMonthsButton = state.format === "monthly" || state.format === "year";

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

  async function handleDownloadPdf() {
    setError(null);
    setPdfDownloading(true);
    setExporting(true);
    try {
      await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));

      const node = document.getElementById("export-node");
      if (!node) throw new Error("Nothing to export yet — the preview hasn't rendered.");

      const filename = `awqat-${state.format}-${slugify(state.city)}.pdf`;
      await exportPdf(node, { size: pdfSize, orientation: pdfOrientation, filename });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setExporting(false);
      setPdfDownloading(false);
    }
  }

  // "Download all 12 months": the visible preview only ever shows one month
  // at a time, and driving `updateState({ month })` through 12 sequential
  // fetch+render cycles (waiting on Studio's async fetch effect to settle
  // each time, with no DOM-exposed "this month is loaded" signal to poll)
  // proved too flaky to do reliably from here. Instead this renders each
  // month independently: fetch its data directly via `getMonthly` (same
  // data source Studio itself uses) and mount it into a detached, offscreen
  // React root sized like the monthly export-node — never touching
  // `state.month` or the visible preview at all, so there's nothing to
  // restore afterwards and no risk of flashing the UI through 12 months.
  async function handleDownloadAllMonths() {
    setError(null);
    setZipDownloading(true);
    setExporting(true);

    const monthlyTemplates = templatesFor("monthly");
    const currentTemplateDef = TEMPLATES.find((t) => t.id === state.template);
    // While viewing `monthly`, reuse the exact template the user has
    // selected; while viewing `year` (which has no per-month template of
    // its own), fall back to the first monthly template sharing the current
    // template's lane (personal/organization), or failing that, any
    // monthly template.
    const templateDef =
      (state.format === "monthly" ? currentTemplateDef : undefined) ??
      monthlyTemplates.find((t) => t.lane === currentTemplateDef?.lane) ??
      monthlyTemplates[0];
    const theme = THEMES.find((t) => t.id === state.theme) ?? THEMES[0];

    if (!templateDef) {
      setError("No monthly template available to render.");
      setExporting(false);
      setZipDownloading(false);
      return;
    }

    // `display:none` would collapse the container to 0x0 and break
    // html-to-image's capture, so it's pushed off-screen with
    // `position:fixed` instead — attached to the DOM (so layout/fonts
    // resolve normally) but never visible to the user.
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.top = "0";
    container.style.left = "-10000px";
    container.style.width = `${ALL_MONTHS_NODE_SIZE.width}px`;
    container.style.height = `${ALL_MONTHS_NODE_SIZE.height}px`;
    document.body.appendChild(container);
    const root = createRoot(container);

    try {
      const renderMonth = async (m: number): Promise<Blob> => {
        const monthly = await getMonthly({
          lat: state.lat,
          lon: state.lon,
          year: state.year,
          month: m,
          method: state.method,
          madhab: state.madhab,
        });

        await new Promise<void>((resolve) => {
          root.render(
            <templateDef.Component
              monthly={monthly}
              specialDays={specialDaysForMonth(monthly.days)}
              state={state}
              theme={theme}
            />,
          );
          // Two rAFs: one for React to commit, one for the browser to paint,
          // before html-to-image serializes the container.
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
        });
        await document.fonts.ready;

        const blob = await toBlob(container, { pixelRatio: 2, cacheBust: true });
        if (!blob) throw new Error(`Failed to render month ${m}.`);
        return blob;
      };

      await exportYearZip(renderMonth, `awqat-${state.year}-${slugify(state.city)}-months.zip`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      root.unmount();
      document.body.removeChild(container);
      setExporting(false);
      setZipDownloading(false);
    }
  }

  return (
    <footer className="flex h-14 shrink-0 flex-wrap items-center justify-between gap-4 border-t border-border px-4">
      <div className="flex flex-wrap items-center gap-4">
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

        <div className="flex items-center gap-1.5">
          <span className="mr-1 text-xs text-muted-foreground">PDF size</span>
          {PDF_SIZES.map((s) => (
            <Button
              key={s.value}
              type="button"
              size="sm"
              variant={pdfSize === s.value ? "default" : "outline"}
              aria-pressed={pdfSize === s.value}
              onClick={() => setPdfSizeOverride((prev) => ({ ...prev, [state.format]: s.value }))}
            >
              {s.label}
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <span className="mr-1 text-xs text-muted-foreground">Orientation</span>
          {PDF_ORIENTATIONS.map((o) => (
            <Button
              key={o.value}
              type="button"
              size="sm"
              variant={pdfOrientation === o.value ? "default" : "outline"}
              aria-pressed={pdfOrientation === o.value}
              onClick={() =>
                setPdfOrientationOverride((prev) => ({ ...prev, [state.format]: o.value }))
              }
            >
              {o.label}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {error && (
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}
        {showAllMonthsButton && (
          <Button
            type="button"
            variant="outline"
            onClick={handleDownloadAllMonths}
            disabled={busy}
            className={cn(zipDownloading && "opacity-80")}
          >
            {zipDownloading ? "Zipping…" : "Download all 12 months"}
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          onClick={handleDownloadPdf}
          disabled={busy}
          className={cn(pdfDownloading && "opacity-80")}
        >
          {pdfDownloading ? "Exporting…" : "Download PDF"}
        </Button>
        <Button
          type="button"
          onClick={handleDownload}
          disabled={busy}
          className={cn(downloading && "opacity-80")}
        >
          {downloading ? "Exporting…" : "Download PNG"}
        </Button>
      </div>
    </footer>
  );
}

export default ExportBar;
