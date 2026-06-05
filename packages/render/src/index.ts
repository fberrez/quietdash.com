import { clockScene } from "./clock.js";
import { renderToOneBitPng } from "./render.js";

export { renderToOneBitPng } from "./render.js";
export { atkinsonDither } from "./dither.js";
export { clockScene } from "./clock.js";
export { loadFonts } from "./fonts.js";

/** Convenience: render the Phase 0 clock to a 1-bit (black/white) PNG. */
export function renderClockPng(now: Date = new Date()): Promise<Buffer> {
  return renderToOneBitPng(clockScene(now) as Parameters<typeof renderToOneBitPng>[0]);
}
