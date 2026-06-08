import type { WidgetType } from "@quietdash/shared";
import { agendaWidget } from "./agenda.js";
import { clockWidget } from "./clock.js";
import { dateWidget } from "./date.js";
import { focusWidget } from "./focus.js";
import { notesWidget } from "./notes.js";
import { rssWidget } from "./rss.js";
import { tasksWidget } from "./tasks.js";
import { weatherWidget } from "./weather.js";
import type { WidgetModule } from "./types.js";

/**
 * The widget registry. To add a widget: write a WidgetModule, register it here,
 * and add its config to the union in `@quietdash/shared` (see docs/widgets.md).
 */
export const WIDGETS: Record<WidgetType, WidgetModule> = {
  clock: clockWidget as WidgetModule,
  date: dateWidget as WidgetModule,
  weather: weatherWidget as WidgetModule,
  agenda: agendaWidget as WidgetModule,
  tasks: tasksWidget as WidgetModule,
  focus: focusWidget as WidgetModule,
  rss: rssWidget as WidgetModule,
  notes: notesWidget as WidgetModule,
};

export type { WidgetModule, WidgetContext, SlotBox, WidgetDataKind } from "./types.js";
