import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Font } from "satori";

const assetsDir = join(dirname(fileURLToPath(import.meta.url)), "..", "assets");

let cached: Font[] | null = null;

/**
 * Bundled fonts (both OFL), loaded once and cached:
 * - IBM Plex Mono: clock, focus, numerics (the "terminal calm" brand voice).
 * - Atkinson Hyperlegible: agenda / rss / tasks / notes body text, designed
 *   for maximum character distinction at small sizes — ideal on 1-bit e-ink.
 * All widget text is pure #000 on #fff, so it snaps crisp under FLAT_BAND.
 */
export function loadFonts(): Font[] {
  if (cached) return cached;
  cached = [
    {
      name: "IBM Plex Mono",
      data: readFileSync(join(assetsDir, "IBMPlexMono-Regular.ttf")),
      weight: 400,
      style: "normal",
    },
    {
      name: "IBM Plex Mono",
      data: readFileSync(join(assetsDir, "IBMPlexMono-Bold.ttf")),
      weight: 700,
      style: "normal",
    },
    {
      name: "Atkinson Hyperlegible",
      data: readFileSync(join(assetsDir, "AtkinsonHyperlegible-Regular.ttf")),
      weight: 400,
      style: "normal",
    },
    {
      name: "Atkinson Hyperlegible",
      data: readFileSync(join(assetsDir, "AtkinsonHyperlegible-Bold.ttf")),
      weight: 700,
      style: "normal",
    },
  ];
  return cached;
}
