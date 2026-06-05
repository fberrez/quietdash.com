import { Resvg } from "@resvg/resvg-js";
import { PNG } from "pngjs";
import satori from "satori";
import { DISPLAY } from "@quietdash/shared";
import { atkinsonDither } from "./dither.js";
import { loadFonts } from "./fonts.js";

type SatoriNode = Parameters<typeof satori>[0];

/**
 * The shared 1-bit pipeline (D8): JSX/HTML -> SVG (satori) -> raster (resvg)
 * -> grayscale -> Atkinson dither -> PNG. The same code runs server-side and
 * (later) in the browser for the studio preview, so preview == device output.
 *
 * Phase 0 note: the PNG is emitted as RGBA carrying only pure black/white
 * pixels (already dithered to 2 colours). True 1-bit-depth PNG packing is a
 * later optimization; the device thresholds to the panel buffer regardless.
 */
export async function renderToOneBitPng(node: SatoriNode): Promise<Buffer> {
  const svg = await satori(node, {
    width: DISPLAY.WIDTH,
    height: DISPLAY.HEIGHT,
    fonts: loadFonts(),
  });

  const rendered = new Resvg(svg, {
    fitTo: { mode: "width", value: DISPLAY.WIDTH },
    background: "white",
  }).render();

  const { width, height } = rendered;
  const rgba = rendered.pixels;

  // Perceptual luminance (Rec. 601), ignoring alpha over the white background.
  const gray = new Float32Array(width * height);
  for (let i = 0; i < width * height; i++) {
    const r = rgba[i * 4]!;
    const g = rgba[i * 4 + 1]!;
    const b = rgba[i * 4 + 2]!;
    gray[i] = 0.299 * r + 0.587 * g + 0.114 * b;
  }

  const bilevel = atkinsonDither(gray, width, height);

  const png = new PNG({ width, height });
  for (let i = 0; i < width * height; i++) {
    const v = bilevel[i]!;
    png.data[i * 4] = v;
    png.data[i * 4 + 1] = v;
    png.data[i * 4 + 2] = v;
    png.data[i * 4 + 3] = 255;
  }
  return PNG.sync.write(png);
}
