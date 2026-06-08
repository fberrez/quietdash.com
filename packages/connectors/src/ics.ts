import type { AgendaData } from "@quietdash/shared";
import ICAL from "ical.js";
import type { Connector } from "./types.js";

export interface IcsConfig {
  /** one or more public read-only .ics URLs (Google/Apple/Outlook exports) */
  urls: string[];
  /** legacy single-url form, still accepted */
  url?: string;
  /** how many days ahead to expand recurrences */
  windowDays?: number;
}

type Occurrence = { title: string; start: string; allDay: boolean };

function parseFeed(text: string, now: Date, windowDays: number): Occurrence[] {
  const comp = new ICAL.Component(ICAL.parse(text));
  const rangeStart = ICAL.Time.fromJSDate(now, false);
  const rangeEnd = ICAL.Time.fromJSDate(new Date(now.getTime() + windowDays * 86_400_000), false);

  const out: Occurrence[] = [];
  for (const ve of comp.getAllSubcomponents("vevent")) {
    const event = new ICAL.Event(ve);
    const allDay = event.startDate.isDate;
    if (event.isRecurring()) {
      const it = event.iterator();
      let next = it.next();
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
  return out;
}

/**
 * Public ICS calendars (no OAuth). Fetches every configured URL, expands events
 * (incl. recurrences) within the next `windowDays`, and merges them sorted by
 * start. A single failing calendar is skipped; only if every one fails do we
 * throw (so "test connection" reports the problem).
 */
export const icsConnector: Connector<IcsConfig, AgendaData> = {
  kind: "ics",
  async fetch(cfg, _secret, ctx) {
    const urls = cfg.urls?.length ? cfg.urls : cfg.url ? [cfg.url] : [];
    if (!urls.length) throw new Error("no calendar URL configured");
    const windowDays = cfg.windowDays ?? 14;

    const results = await Promise.allSettled(
      urls.map(async (url) => {
        const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (!res.ok) throw new Error(`ICS ${res.status}: ${res.statusText}`);
        return parseFeed(await res.text(), ctx.now, windowDays);
      }),
    );

    const ok = results.filter((r) => r.status === "fulfilled") as PromiseFulfilledResult<Occurrence[]>[];
    if (!ok.length) {
      const firstErr = results.find((r) => r.status === "rejected") as PromiseRejectedResult | undefined;
      throw new Error(firstErr ? String(firstErr.reason instanceof Error ? firstErr.reason.message : firstErr.reason) : "no calendars reachable");
    }

    const events = ok.flatMap((r) => r.value).sort((a, b) => a.start.localeCompare(b.start));
    return { events };
  },
};
