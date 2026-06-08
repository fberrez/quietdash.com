import { type DashboardLayout, type WidgetType, layoutSlotErrors } from "@quietdash/shared";
import { el, text } from "./el.js";
import { LAYOUTS } from "./layouts/index.js";
import { renderToOneBitPng } from "./render.js";
import { INK, MONO, PAPER, SANS } from "./widgets/style.js";
import type { SatoriNode } from "./types.js";
import type { WidgetDataKind } from "./widgets/types.js";
import { WIDGETS } from "./widgets/index.js";

/** Server-resolved data keyed by slot name (connectors + local tasks). */
export type ResolvedSlotData = Record<string, unknown>;

export interface RequiredSource {
  slot: string;
  kind: WidgetDataKind;
  type: WidgetType;
  config: unknown;
}

/**
 * Walk a layout and list the connector/local fetches the server must run
 * before rendering. The server resolves these into ResolvedSlotData.
 */
export function requiredDataSources(layout: DashboardLayout): RequiredSource[] {
  const template = LAYOUTS[layout.layoutId];
  const out: RequiredSource[] = [];
  for (const slot of template.slots) {
    const inst = layout.slots[slot.name];
    if (!inst) continue;
    const widget = WIDGETS[inst.type];
    if (widget.dataSource) out.push({ slot: slot.name, kind: widget.dataSource, type: inst.type, config: inst.config });
  }
  return out;
}

/**
 * The single render entry point (replaces the hardcoded clock). Composes a
 * dashboard layout + pre-resolved data into one 800x480 1-bit PNG. Used
 * identically by the device image route and the studio preview.
 */
export async function renderDashboardPng(
  layout: DashboardLayout,
  resolved: ResolvedSlotData,
  opts: { now: Date; timezone: string },
): Promise<Buffer> {
  const errors = layoutSlotErrors(layout);
  if (errors.length) return renderErrorPng(errors.join("; "));

  const template = LAYOUTS[layout.layoutId];
  const rendered: Record<string, SatoriNode> = {};
  for (const slot of template.slots) {
    const inst = layout.slots[slot.name];
    if (!inst) continue;
    const widget = WIDGETS[inst.type];
    rendered[slot.name] = widget.render({
      config: inst.config,
      data: resolved[slot.name] ?? null,
      now: opts.now,
      box: slot.box,
      timezone: opts.timezone,
    });
  }
  return renderToOneBitPng(template.compose(rendered));
}

/** A clean 1-bit card so the device never gets a blank panel on bad input. */
export function renderErrorPng(message: string): Promise<Buffer> {
  const node = el(
    {
      display: "flex",
      flexDirection: "column",
      width: "100%",
      height: "100%",
      backgroundColor: PAPER,
      color: INK,
      alignItems: "center",
      justifyContent: "center",
      padding: "48px",
    },
    [
      text({ display: "flex", fontFamily: MONO, fontSize: "20px", fontWeight: "700", letterSpacing: "2px", marginBottom: "16px" }, "QUIETDASH"),
      text({ display: "flex", fontFamily: SANS, fontSize: "22px", lineHeight: "1.4" }, message),
    ],
  );
  return renderToOneBitPng(node);
}
