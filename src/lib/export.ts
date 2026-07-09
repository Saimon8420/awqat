import { toPng } from "html-to-image";
import { saveAs } from "file-saver";

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
