import { z } from "zod";

/**
 * The public dashboard contract (DECISIONS D7/D8, issue #1 product surface).
 *
 * This is what `dashboards.layout` holds and what `POST /api/dashboards`
 * accepts. It is a STABLE, hand-authorable contract: power users can write the
 * JSON directly, and contributors add widgets against the `WidgetInstance`
 * union here (see docs/widgets.md). Bump `version` on any breaking change.
 *
 * A dashboard = a curated layout (named slots) + one widget assigned per slot.
 * We own the layouts; the user fills slots. Slot *names* live here so the
 * studio knows them without importing the render package; slot *geometry*
 * lives in `@quietdash/render` (the layout templates).
 */

// --- widget configs (one per widget type) ---

export const clockConfig = z.object({
  format: z.enum(["24h", "12h"]).default("24h"),
  seconds: z.boolean().default(false),
});

export const dateConfig = z.object({
  style: z.enum(["long", "short"]).default("long"),
});

export const weatherConfig = z.object({
  connectorId: z.string().min(1),
  units: z.enum(["metric", "imperial"]).default("metric"),
});

export const agendaConfig = z.object({
  connectorId: z.string().min(1),
  maxEvents: z.number().int().min(1).max(10).default(4),
});

export const tasksConfig = z.object({
  /** which local task list to show; the owner's first list if omitted */
  listId: z.string().optional(),
  maxItems: z.number().int().min(1).max(12).default(6),
});

export const focusConfig = z.object({
  workMinutes: z.number().int().min(1).max(180).default(25),
  breakMinutes: z.number().int().min(1).max(60).default(5),
});

export const rssConfig = z.object({
  connectorId: z.string().min(1),
  maxItems: z.number().int().min(1).max(8).default(5),
});

export const notesConfig = z.object({
  text: z.string().max(500).default(""),
});

export type ClockConfig = z.infer<typeof clockConfig>;
export type DateConfig = z.infer<typeof dateConfig>;
export type WeatherConfig = z.infer<typeof weatherConfig>;
export type AgendaConfig = z.infer<typeof agendaConfig>;
export type TasksConfig = z.infer<typeof tasksConfig>;
export type FocusConfig = z.infer<typeof focusConfig>;
export type RssConfig = z.infer<typeof rssConfig>;
export type NotesConfig = z.infer<typeof notesConfig>;

// --- widget instance (discriminated union on `type`) ---

export const WIDGET_TYPES = [
  "clock",
  "date",
  "weather",
  "agenda",
  "tasks",
  "focus",
  "rss",
  "notes",
] as const;
export type WidgetType = (typeof WIDGET_TYPES)[number];

export const widgetInstance = z.discriminatedUnion("type", [
  z.object({ type: z.literal("clock"), config: clockConfig }),
  z.object({ type: z.literal("date"), config: dateConfig }),
  z.object({ type: z.literal("weather"), config: weatherConfig }),
  z.object({ type: z.literal("agenda"), config: agendaConfig }),
  z.object({ type: z.literal("tasks"), config: tasksConfig }),
  z.object({ type: z.literal("focus"), config: focusConfig }),
  z.object({ type: z.literal("rss"), config: rssConfig }),
  z.object({ type: z.literal("notes"), config: notesConfig }),
]);
export type WidgetInstance = z.infer<typeof widgetInstance>;

// --- layouts + their slot names ---

export const LAYOUT_IDS = ["single-big", "desk-focus", "agenda", "split-2", "grid-4"] as const;
export type LayoutId = (typeof LAYOUT_IDS)[number];

/**
 * Slot names per layout. Must match the layout templates' slot boxes in
 * `@quietdash/render`. The studio reads this to render the per-slot editor.
 */
export const LAYOUT_SLOTS: Record<LayoutId, readonly string[]> = {
  "single-big": ["main"],
  "desk-focus": ["main", "aside", "footer"],
  agenda: ["header", "body"],
  "split-2": ["left", "right"],
  "grid-4": ["top-left", "top-right", "bottom-left", "bottom-right"],
};

// --- the dashboard layout document ---

export const dashboardLayout = z.object({
  version: z.literal(1),
  layoutId: z.enum(LAYOUT_IDS),
  /** slot name -> assigned widget. A slot may be absent (renders empty). */
  slots: z.record(z.string(), widgetInstance),
});
export type DashboardLayout = z.infer<typeof dashboardLayout>;

/**
 * Cross-field validation zod can't express: every key in `slots` must be a
 * real slot of `layoutId`. Returns human-readable errors (empty = valid).
 * Used server-side (reject CRUD) and at render (fall back to an error card).
 */
export function layoutSlotErrors(layout: DashboardLayout): string[] {
  const valid = LAYOUT_SLOTS[layout.layoutId];
  const errors: string[] = [];
  for (const name of Object.keys(layout.slots)) {
    if (!valid.includes(name)) {
      errors.push(`unknown slot "${name}" for layout "${layout.layoutId}" (valid: ${valid.join(", ")})`);
    }
  }
  return errors;
}

/** A clean default a fresh dashboard / seed can use: one big clock. */
export function defaultDashboardLayout(): DashboardLayout {
  return {
    version: 1,
    layoutId: "single-big",
    slots: { main: { type: "clock", config: { format: "24h", seconds: false } } },
  };
}

// --- normalized connector / data-source output shapes ---
// Shared so a connector's output type and the widget's `data` type agree.

export const weatherData = z.object({
  tempC: z.number(),
  condition: z.string(),
  /** short icon key the weather widget maps to a glyph, e.g. "clear", "rain" */
  icon: z.string(),
  high: z.number(),
  low: z.number(),
  location: z.string(),
});
export type WeatherData = z.infer<typeof weatherData>;

export const agendaData = z.object({
  events: z.array(
    z.object({
      title: z.string(),
      /** ISO start; for all-day events the date portion is what matters */
      start: z.string(),
      allDay: z.boolean(),
    }),
  ),
});
export type AgendaData = z.infer<typeof agendaData>;

export const rssData = z.object({
  items: z.array(
    z.object({
      title: z.string(),
      source: z.string(),
      /** ISO published date, or null if the feed omits it */
      published: z.string().nullable(),
    }),
  ),
});
export type RssData = z.infer<typeof rssData>;

/** Local tasks resolved for the tasks widget (not a connector). */
export const tasksData = z.object({
  items: z.array(z.object({ title: z.string(), done: z.boolean() })),
});
export type TasksData = z.infer<typeof tasksData>;
