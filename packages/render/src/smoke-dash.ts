import { writeFileSync } from "node:fs";
import type { DashboardLayout } from "@quietdash/shared";
import { renderDashboardPng } from "./compose.js";

const now = new Date(2026, 5, 8, 9, 41);
const tz = "Europe/Paris";

const weather = { tempC: 14, condition: "Partly cloudy", icon: "clouds", high: 17, low: 9, location: "Paris, FR" };
const agenda = {
  events: [
    { title: "Standup with the team", start: new Date(2026, 5, 8, 9, 30).toISOString(), allDay: false },
    { title: "Design review for the enclosure", start: new Date(2026, 5, 8, 14, 0).toISOString(), allDay: false },
    { title: "Dentist", start: new Date(2026, 5, 8).toISOString(), allDay: true },
  ],
};
const tasks = {
  items: [
    { title: "Ship the product-surface PR", done: false },
    { title: "Reply to Holly about the open format", done: true },
    { title: "Order birch plywood for the frame", done: false },
  ],
};
const rss = {
  items: [
    { title: "The e-ink panel ended up being my favorite part of this desk", source: "r/desksetup", published: null },
    { title: "Built this little desk dashboard with an e-ink panel", source: "r/raspberry_pi", published: null },
  ],
};

const cases: { name: string; layout: DashboardLayout; data: Record<string, unknown> }[] = [
  {
    name: "desk-focus",
    layout: {
      version: 1,
      layoutId: "desk-focus",
      slots: {
        main: { type: "clock", config: { format: "24h", seconds: false } },
        aside: { type: "weather", config: { connectorId: "w", units: "metric" } },
        footer: { type: "agenda", config: { connectorId: "a", maxEvents: 4 } },
      },
    },
    data: { aside: weather, footer: agenda },
  },
  {
    name: "agenda",
    layout: {
      version: 1,
      layoutId: "agenda",
      slots: {
        header: { type: "date", config: { style: "long" } },
        body: { type: "agenda", config: { connectorId: "a", maxEvents: 6 } },
      },
    },
    data: { body: agenda },
  },
  {
    name: "grid-4",
    layout: {
      version: 1,
      layoutId: "grid-4",
      slots: {
        "top-left": { type: "clock", config: { format: "24h", seconds: false } },
        "top-right": { type: "weather", config: { connectorId: "w", units: "metric" } },
        "bottom-left": { type: "tasks", config: { maxItems: 4 } },
        "bottom-right": { type: "rss", config: { connectorId: "r", maxItems: 3 } },
      },
    },
    data: { "bottom-left": tasks, "bottom-right": rss },
  },
  {
    name: "split-2",
    layout: {
      version: 1,
      layoutId: "split-2",
      slots: {
        left: { type: "tasks", config: { maxItems: 6 } },
        right: { type: "focus", config: { workMinutes: 25, breakMinutes: 5 } },
      },
    },
    data: { left: tasks },
  },
  {
    name: "single-big",
    layout: {
      version: 1,
      layoutId: "single-big",
      slots: { main: { type: "notes", config: { text: "Calm means fewer things, done better. Look up, not down." } } },
    },
    data: {},
  },
];

for (const c of cases) {
  const t0 = Date.now();
  const png = await renderDashboardPng(c.layout, c.data, { now, timezone: tz });
  const out = `/tmp/qd-${c.name}.png`;
  writeFileSync(out, png);
  console.log(`OK ${c.name.padEnd(11)} ${png.length} bytes ${png.readUInt32BE(16)}x${png.readUInt32BE(20)} ${Date.now() - t0}ms -> ${out}`);
}
