import { toJpeg, toPng } from "html-to-image";
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

// Output pixel-density multiplier for single-image captures. #export-node is
// authored at a ~1080–1587px "1x" design width; capturing at 3x yields a
// crisp, print-quality raster (and a healthy file size) instead of the soft,
// tiny 1x export.
const EXPORT_PIXEL_RATIO = 3;

/**
 * Options shared by the PNG and PDF captures. Two things matter here:
 *  - `width`/`height` pin the capture to the node's own intrinsic box, so the
 *    output is tightly cropped to the content — no surrounding whitespace.
 *  - `style.transform: none` neutralizes the preview-fit `transform: scale(...)`
 *    that `PreviewStage` applies to shrink the node into the on-screen stage.
 *    Without this override html-to-image bakes that scale into the clone and
 *    the template renders shrunk into the top-left corner of the canvas (the
 *    "content in one quadrant, rest empty" bug).
 */
function captureOptions(node: HTMLElement, pixelRatio: number) {
  return {
    pixelRatio,
    width: node.offsetWidth,
    height: node.offsetHeight,
    style: { transform: "none", transformOrigin: "top left", margin: "0" },
    cacheBust: true,
  };
}

/**
 * Captures `node` (the `#export-node`, per `PreviewStage`) to a PNG tightly
 * cropped to its intrinsic size and rendered at `EXPORT_PIXEL_RATIO`, then
 * triggers a browser download named `opts.filename`.
 *
 * Awaits `document.fonts.ready` first so the bundled Bengali/Arabic/Latin
 * webfonts are guaranteed to be loaded before html-to-image serializes the
 * node — otherwise a capture that races font loading can silently fall back
 * to system fonts.
 */
export async function exportPng(
  node: HTMLElement,
  opts: { filename: string },
): Promise<void> {
  await document.fonts.ready;
  const dataUrl = await toPng(node, captureOptions(node, EXPORT_PIXEL_RATIO));
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

// A4/A3 sheet sizes in points (portrait: [short, long]). Used only to bound
// how large the content-shaped PDF page may be for the chosen paper.
const SHEETS: Record<"a4" | "a3", readonly [number, number]> = {
  a4: [595.28, 841.89],
  a3: [841.89, 1190.55],
};

/**
 * Captures `node` (expected to be `#export-node`, same convention as
 * `exportPng`) and embeds it into a single-page `jsPDF`, then triggers a
 * browser download named `opts.filename`.
 *
 * Two deliberate choices, both fixing user-reported problems:
 *  - **JPEG, not PNG.** A lossless PNG of a full-bleed poster ran ~24 MB;
 *    a high-quality JPEG of the same card is a fraction of that, while
 *    capturing at the same 3x density as the PNG (≈288 DPI once fitted to
 *    A4/A3) keeps text sharp enough to stay crisp when zoomed in the PDF.
 *  - **The PDF page is shaped to the CONTENT, not to A4/A3.** The card's
 *    aspect (story 9:16, square, post 4:5, monthly landscape…) rarely matches
 *    paper, so the old fixed-A4 page letterboxed the image with white bands.
 *    Instead the page is the content's aspect ratio, scaled to fit within the
 *    chosen sheet — so the card fills the page edge to edge, no white margins.
 *
 * Like `exportPng`, awaits `document.fonts.ready` first so webfonts are
 * loaded before html-to-image serializes the node.
 */
export async function exportPdf(
  node: HTMLElement,
  opts: { size: "a4" | "a3"; orientation: "portrait" | "landscape"; filename: string },
): Promise<void> {
  await document.fonts.ready;
  // Same transform-neutralizing / tight-crop capture as exportPng, as a JPEG:
  // the 3x density (matching the PNG) keeps text sharp on zoom, and q0.95
  // still shrinks the file dramatically versus a lossless PNG.
  const dataUrl = await toJpeg(node, { ...captureOptions(node, EXPORT_PIXEL_RATIO), quality: 0.95 });

  const [short, long] = SHEETS[opts.size];
  const sheet =
    opts.orientation === "landscape"
      ? { width: long, height: short }
      : { width: short, height: long };
  // The node's on-screen box gives the correct aspect ratio (offsetWidth/Height,
  // not the pixel-ratio-scaled raster). Fit that aspect inside the sheet to get
  // the page size; the image then fills the whole page.
  const content = { width: node.offsetWidth || 1, height: node.offsetHeight || 1 };
  const { w, h } = fitToPage(content, sheet);

  const pdf = new jsPDF({
    unit: "pt",
    format: [w, h],
    orientation: w >= h ? "landscape" : "portrait",
  });
  // Read back the actual page box (jsPDF may normalize the format array) so
  // the image fills it exactly regardless of any reordering.
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  pdf.addImage(dataUrl, "JPEG", 0, 0, pageW, pageH, undefined, "FAST");
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
