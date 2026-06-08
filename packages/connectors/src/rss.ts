import type { RssData } from "@quietdash/shared";
import { XMLParser } from "fast-xml-parser";
import type { Connector } from "./types.js";

export interface RssConnectorConfig {
  url: string;
}

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
const asArray = <T>(v: T | T[] | undefined): T[] => (v == null ? [] : Array.isArray(v) ? v : [v]);
const str = (v: unknown): string => (typeof v === "string" ? v : typeof v === "number" ? String(v) : "");
const toIso = (v: unknown): string | null => {
  const s = str(v);
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

/** RSS 2.0 + Atom feeds, normalized to title/source/published. No bodies. */
export const rssConnector: Connector<RssConnectorConfig, RssData> = {
  kind: "rss",
  async fetch(cfg) {
    const res = await fetch(cfg.url, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error(`RSS ${res.status}: ${res.statusText}`);
    const xml = await res.text();
    const doc = parser.parse(xml) as Record<string, any>;

    if (doc.rss?.channel) {
      const channel = doc.rss.channel;
      const source = str(channel.title);
      const items = asArray(channel.item).map((it: any) => ({
        title: str(it.title),
        source,
        published: toIso(it.pubDate),
      }));
      return { items: items.slice(0, 20) };
    }

    if (doc.feed) {
      const source = str(doc.feed.title);
      const items = asArray(doc.feed.entry).map((e: any) => ({
        title: str(typeof e.title === "object" ? e.title["#text"] : e.title),
        source,
        published: toIso(e.published ?? e.updated),
      }));
      return { items: items.slice(0, 20) };
    }

    throw new Error("unrecognized feed format (not RSS 2.0 or Atom)");
  },
};
