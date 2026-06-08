import type { AgendaData } from "@quietdash/shared";
import ICAL from "ical.js";
import type { Connector } from "./types.js";

export interface IcsConfig {
  /** public read-only .ics URL (Google/Apple/Outlook all export one) */
  url: string;
  /** how many days ahead to expand recurrences */
  windowDays?: number;
}

type Occurrence = { title: string; start: string; allDay: boolean };

/**
 * Public ICS calendar (no OAuth). Fetches the feed and expands events —
 * including recurrences — within the next `windowDays`, sorted by start.
 */
export const icsConnector: Connector<IcsConfig, AgendaData> = {
  kind: "ics",
  async fetch(cfg, _secret, ctx) {
    const res = await fetch(cfg.url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`ICS ${res.status}: ${res.statusText}`);
    const text = await res.text();

    const comp = new ICAL.Component(ICAL.parse(text));
    const windowDays = cfg.windowDays ?? 14;
    const rangeStart = ICAL.Time.fromJSDate(ctx.now, false);
    const rangeEnd = ICAL.Time.fromJSDate(new Date(ctx.now.getTime() + windowDays * 86_400_000), false);

    const out: Occurrence[] = [];
    for (const ve of comp.getAllSubcomponents("vevent")) {
      const event = new ICAL.Event(ve);
      const allDay = event.startDate.isDate;

      if (event.isRecurring()) {
        const it = event.iterator();
        let next = it.next();
        // cap iterations so a malformed infinite RRULE can't hang the fetch
        for (let guard = 0; next && guard < 1000; guard++, next = it.next()) {
          if (next.compare(rangeEnd) > 0) break;
          const occ = event.getOccurrenceDetails(next);
          if (occ.endDate.compare(rangeStart) < 0) continue;
          out.push({ title: event.summary ?? "", start: occ.startDate.toJSDate().toISOString(), allDay });
        }
      } else {
        if (event.endDate.compare(rangeStart) < 0 || event.startDate.compare(rangeEnd) > 0) continue;
        out.push({ title: event.summary ?? "", start: event.startDate.toJSDate().toISOString(), allDay });
      }
    }

    out.sort((a, b) => a.start.localeCompare(b.start));
    return { events: out };
  },
};
