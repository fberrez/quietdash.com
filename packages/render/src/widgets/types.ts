import type { SatoriNode } from "../types.js";

/** A slot's drawable size in device pixels, so widgets can scale to fit. */
export interface SlotBox {
  width: number;
  height: number;
}

/** Kinds of data the server resolves before render (connectors + local). */
export type WidgetDataKind = "openweather" | "ics" | "rss" | "tasks";

/**
 * Everything a widget needs. Data is PRE-RESOLVED by the server (connectors,
 * local tasks) and passed in — widgets do NO I/O. That keeps the same render
 * path usable for both the device image and the studio preview, makes widgets
 * trivially testable, and makes a contributed widget safe to accept by PR.
 */
export interface WidgetContext<C = unknown, D = unknown> {
  config: C;
  /** resolved data for this widget, or null if none / unavailable */
  data: D | null;
  /** real server clock; widgets format for display using `timezone` */
  now: Date;
  box: SlotBox;
  /** IANA timezone for display formatting */
  timezone: string;
}

/** A widget is a pure function: context -> satori node. No side effects. */
export interface WidgetModule<C = unknown, D = unknown> {
  type: string;
  /** declares the data the server must resolve before calling render() */
  dataSource?: WidgetDataKind;
  render(ctx: WidgetContext<C, D>): SatoriNode;
}
