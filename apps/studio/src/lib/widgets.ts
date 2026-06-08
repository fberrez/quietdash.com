import type { WidgetInstance, WidgetType } from "@quietdash/shared";

export const WIDGET_LABELS: Record<WidgetType, string> = {
  clock: "Clock",
  date: "Date",
  weather: "Weather",
  agenda: "Agenda",
  tasks: "Tasks",
  focus: "Focus",
  rss: "Feed (RSS)",
  notes: "Notes",
};

/** The connector kind a widget needs ("tasks" is local; null = no data). */
export const WIDGET_NEEDS: Record<WidgetType, "openweather" | "ics" | "rss" | "tasks" | null> = {
  clock: null,
  date: null,
  notes: null,
  focus: null,
  weather: "openweather",
  agenda: "ics",
  rss: "rss",
  tasks: "tasks",
};

/** A sensible default widget instance for a freshly assigned slot. */
export function defaultWidget(type: WidgetType, connectorId = ""): WidgetInstance {
  switch (type) {
    case "clock":
      return { type, config: { format: "24h", seconds: false } };
    case "date":
      return { type, config: { style: "long" } };
    case "weather":
      return { type, config: { connectorId, units: "metric" } };
    case "agenda":
      return { type, config: { connectorId, maxEvents: 4 } };
    case "tasks":
      return { type, config: { maxItems: 6 } };
    case "focus":
      return { type, config: { workMinutes: 25, breakMinutes: 5 } };
    case "rss":
      return { type, config: { connectorId, maxItems: 5 } };
    case "notes":
      return { type, config: { text: "" } };
  }
}
