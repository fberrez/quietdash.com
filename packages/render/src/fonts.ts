import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Font } from "satori";

const assetsDir = join(dirname(fileURLToPath(import.meta.url)), "..", "assets");

let cached: Font[] | null = null;

/** IBM Plex Mono (OFL), bundled in ./assets. Loaded once, cached. */
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
  ];
  return cached;
}
