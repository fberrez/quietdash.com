import { clockScene } from "./clock.js";
import { renderToOneBitPng } from "./render.js";

export { renderToOneBitPng } from "./render.js";
export { atkinsonDither } from "./dither.js";
export { loadFonts } from "./fonts.js";

// Dashboard composition (the product surface).
export { renderDashboardPng, renderErrorPng, requiredDataSources } from "./compose.js";
export type { ResolvedSlotData, RequiredSource } from "./compose.js";
export { WIDGETS } from "./widgets/index.js";
export type { WidgetModule, WidgetContext, SlotBox, WidgetDataKind } from "./widgets/types.js";
export { LAYOUTS } from "./layouts/index.js";
export type { LayoutTemplate, LayoutSlotDef } from "./layouts/index.js";

// Phase 0 clock (kept for the smoke path; superseded by widgets/clock).
export { clockScene } from "./clock.js";

/** Convenience: render the Phase 0 clock to a 1-bit (black/white) PNG. */
export function renderClockPng(now: Date = new Date()): Promise<Buffer> {
  return renderToOneBitPng(clockScene(now) as Parameters<typeof renderToOneBitPng>[0]);
}
