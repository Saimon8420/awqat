import { useState } from "react";
import { createRoot } from "react-dom/client";
import { toBlob } from "html-to-image";
import { Button } from "@/components/ui/button";
import { Segmented } from "@/components/ui/segmented";
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
// export-node (see `PreviewStage`'s `intrinsicSizeFor`), matched to the
// chosen orientation so the batch export mirrors the on-screen poster.
const ALL_MONTHS_NODE_SIZE = {
  portrait: { width: 1080, height: 1350 },
  landscape: { width: 1528, height: 1080 },
} as const;

/**
 * Bottom bar of the Studio: lets the user pick an export aspect ratio for
 * the `daily` format (Story/Square/Post — see `PreviewStage`'s
 * `DAILY_RATIO_SIZE`), a PDF page size/orientation, and triggers PNG/PDF
 * captures of `#export-node` plus a "Download all 12 months" zip.
 *
 * The ratio toggle is disabled for `monthly`/`year`, which always use their
 * own fixed canvas size (portrait poster / A3 landscape respectively).
 */
export function ExportBar({ variant = "bar" }: { variant?: "bar" | "sheet" } = {}) {
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

  const busy = downloading || pdfDownloading || zipDownloading;
  const pdfSize = pdfSizeOverride[state.format] ?? PDF_DEFAULTS[state.format].size;
  // Orientation is a live preview control for `monthly` only; `daily` is
  // governed by its aspect ratio (always portrait output) and `year` is always
  // landscape. Preview, PNG and PDF all read this single derived value so what
  // you see is exactly what exports.
  const orientation: "portrait" | "landscape" =
    state.format === "year"
      ? "landscape"
      : state.format === "monthly"
        ? state.orientation ?? "portrait"
        : "portrait";
  const showRatio = state.format === "daily";
  const showOrientation = state.format === "monthly";
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
      await exportPng(node, { filename });
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
      await exportPdf(node, { size: pdfSize, orientation, filename });
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
    // Batch renders mirror the monthly poster's orientation; the year format's
    // batch stays portrait (its own preview is a separate landscape canvas).
    const nodeSize =
      state.format === "monthly" && orientation === "landscape"
        ? ALL_MONTHS_NODE_SIZE.landscape
        : ALL_MONTHS_NODE_SIZE.portrait;
    const container = document.createElement("div");
    container.style.position = "fixed";
    container.style.top = "0";
    container.style.left = "-10000px";
    container.style.width = `${nodeSize.width}px`;
    container.style.height = `${nodeSize.height}px`;
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

  const sheet = variant === "sheet";

  // One definition of each control, laid out two ways: inline on the desktop
  // export bar, and as full-width labelled rows inside the mobile export
  // sheet (where there's no bar to sit in).
  const controls = (
    <>
      {showRatio && (
        <div className={cn("flex items-center gap-2", sheet && "justify-between")}>
          <span className="text-xs text-muted-foreground">Aspect ratio</span>
          <Segmented
            aria-label="Aspect ratio"
            options={RATIOS}
            value={state.exportRatio ?? "story"}
            onChange={(value) => updateState({ exportRatio: value })}
          />
        </div>
      )}

      {showOrientation && (
        <div className={cn("flex items-center gap-2", sheet && "justify-between")}>
          <span className="text-xs text-muted-foreground">Orientation</span>
          <Segmented
            aria-label="Orientation"
            options={PDF_ORIENTATIONS}
            value={orientation}
            onChange={(value) => updateState({ orientation: value })}
          />
        </div>
      )}

      <div className={cn("flex items-center gap-2", sheet && "justify-between")}>
        <span className="text-xs text-muted-foreground">PDF size</span>
        <Segmented
          aria-label="PDF size"
          options={PDF_SIZES}
          value={pdfSize}
          onChange={(value) => setPdfSizeOverride((prev) => ({ ...prev, [state.format]: value }))}
        />
      </div>
    </>
  );

  const errorNode = error ? (
    <p role="alert" className="w-full text-xs text-destructive sm:w-auto">
      {error}
    </p>
  ) : null;

  const allMonthsButton = showAllMonthsButton ? (
    <Button
      type="button"
      variant="outline"
      onClick={handleDownloadAllMonths}
      disabled={busy}
      className={cn(sheet && "w-full", zipDownloading && "opacity-80")}
    >
      {zipDownloading ? "Zipping…" : "Download all 12 months"}
    </Button>
  ) : null;

  const pdfButton = (
    <Button
      type="button"
      variant="outline"
      onClick={handleDownloadPdf}
      disabled={busy}
      className={cn(sheet && "flex-1", pdfDownloading && "opacity-80")}
    >
      {pdfDownloading ? "Exporting…" : "Download PDF"}
    </Button>
  );

  const pngButton = (
    <Button
      type="button"
      onClick={handleDownload}
      disabled={busy}
      className={cn("awqat-shimmer", sheet && "flex-1", downloading && "opacity-80")}
    >
      {downloading ? "Exporting…" : "Download PNG"}
    </Button>
  );

  if (sheet) {
    return (
      <div className="flex flex-col gap-4 pb-1">
        <div className="flex flex-col gap-3">{controls}</div>
        {errorNode}
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            {pdfButton}
            {pngButton}
          </div>
          {allMonthsButton}
        </div>
      </div>
    );
  }

  return (
    <footer className="flex shrink-0 flex-col gap-3 border-t border-border px-4 py-2.5 sm:min-h-14 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4 sm:py-2">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">{controls}</div>

      <div className="flex flex-wrap items-center gap-2 sm:gap-3">
        {errorNode}
        {allMonthsButton}
        {pdfButton}
        {pngButton}
      </div>
    </footer>
  );
}

export default ExportBar;
