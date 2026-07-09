import { toPng } from "html-to-image";
import { saveAs } from "file-saver";
import { jsPDF } from "jspdf";
import JSZip from "jszip";

/**
 * Pure pixel-ratio helper: how much to scale a capture of a node whose
 * current (unscaled) pixel width is `node.width` so the resulting PNG is
 * `targetWidth` pixels wide. Kept as a standalone function (rather than
 * inlined in `exportPng`) so it's unit-testable without touching the DOM or
 * `html-to-image`.
 */
export function exportScale(node: { width: number }, targetWidth: number): number {
  return targetWidth / node.width;
}

/**
 * Captures `node` (expected to be the unscaled `#export-node`, per
 * `PreviewStage` — never the scaled wrapper around it) to a PNG at
 * `opts.targetWidth` pixels wide, then triggers a browser download named
 * `opts.filename`.
 *
 * Awaits `document.fonts.ready` first so the bundled Bengali/Arabic/Latin
 * webfonts are guaranteed to be loaded before html-to-image serializes the
 * node — otherwise a capture that races font loading can silently fall back
 * to system fonts.
 */
export async function exportPng(
  node: HTMLElement,
  opts: { targetWidth: number; filename: string },
): Promise<void> {
  await document.fonts.ready;
  const pixelRatio = exportScale({ width: node.offsetWidth }, opts.targetWidth);
  const dataUrl = await toPng(node, { pixelRatio, cacheBust: true });
  saveAs(dataUrl, opts.filename);
}

/**
 * Pure fit-to-page math: given a source image's pixel size and a PDF page's
 * point size, returns the largest centered rectangle (preserving the
 * source's aspect ratio) that fits entirely inside the page. Kept standalone
 * (rather than inlined in `exportPdf`) so it's unit-testable without a real
 * `jsPDF`/`html-to-image` capture.
 */
export function fitToPage(
  img: { width: number; height: number },
  page: { width: number; height: number },
): { x: number; y: number; w: number; h: number } {
  const scale = Math.min(page.width / img.width, page.height / img.height);
  const w = img.width * scale;
  const h = img.height * scale;
  return { x: (page.width - w) / 2, y: (page.height - h) / 2, w, h };
}

/**
 * Captures `node` (expected to be `#export-node`, same convention as
 * `exportPng`) to a PNG, embeds it — fit-to-page and centered, aspect ratio
 * preserved — into a new single-page `jsPDF` document, and triggers a
 * browser download named `opts.filename`.
 *
 * Like `exportPng`, awaits `document.fonts.ready` first so webfonts are
 * loaded before html-to-image serializes the node.
 */
export async function exportPdf(
  node: HTMLElement,
  opts: { size: "a4" | "a3"; orientation: "portrait" | "landscape"; filename: string },
): Promise<void> {
  await document.fonts.ready;
  const dataUrl = await toPng(node, { pixelRatio: 2, cacheBust: true });

  const pdf = new jsPDF({ format: opts.size, orientation: opts.orientation, unit: "pt" });
  const page = { width: pdf.internal.pageSize.getWidth(), height: pdf.internal.pageSize.getHeight() };
  // toPng preserves the node's on-screen aspect ratio, so node.offsetWidth /
  // node.offsetHeight (not the captured raster's pixel-ratio-scaled size) is
  // the correct aspect-ratio source for the fit math.
  const img = { width: node.offsetWidth || 1, height: node.offsetHeight || 1 };
  const { x, y, w, h } = fitToPage(img, page);

  pdf.addImage(dataUrl, "PNG", x, y, w, h);
  pdf.save(opts.filename);
}

/**
 * Renders each of the 12 months (via the caller-supplied `renderMonth`,
 * which is expected to drive/capture month `m` and resolve with its PNG
 * blob) into a `JSZip` archive named `month-01.png`..`month-12.png`, then
 * triggers a single browser download named `filename`.
 *
 * Deliberately knows nothing about *how* a month is rendered — see
 * `ExportBar`'s "Download all 12 months" handler for the concrete strategy
 * (an offscreen React render per month, independent of the visible studio
 * state) — so this stays thin and unit-testable with a stubbed
 * `renderMonth`.
 */
export async function exportYearZip(
  renderMonth: (m: number) => Promise<Blob>,
  filename: string,
): Promise<void> {
  const zip = new JSZip();
  for (let m = 1; m <= 12; m++) {
    const blob = await renderMonth(m);
    zip.file(`month-${String(m).padStart(2, "0")}.png`, blob);
  }
  const archive = await zip.generateAsync({ type: "blob" });
  saveAs(archive, filename);
}
