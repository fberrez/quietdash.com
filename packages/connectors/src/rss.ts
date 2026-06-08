import type { RssData } from "@quietdash/shared";
import { XMLParser } from "fast-xml-parser";
import type { Connector } from "./types.js";

export interface RssConnectorConfig {
  /** one or more RSS 2.0 / Atom feed URLs */
  urls: string[];
  /** legacy single-url form, still accepted */
  url?: string;
}

type Item = { title: string; source: string; published: string | null };

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
const asArray = <T>(v: T | T[] | undefined): T[] => (v == null ? [] : Array.isArray(v) ? v : [v]);
const str = (v: unknown): string => (typeof v === "string" ? v : typeof v === "number" ? String(v) : "");
const toIso = (v: unknown): string | null => {
  const s = str(v);
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

function parseFeed(xml: string): Item[] {
  const doc = parser.parse(xml) as Record<string, any>;
  if (doc.rss?.channel) {
    const channel = doc.rss.channel;
    const source = str(channel.title);
    return asArray(channel.item).map((it: any) => ({ title: str(it.title), source, published: toIso(it.pubDate) }));
  }
  if (doc.feed) {
    const source = str(doc.feed.title);
    return asArray(doc.feed.entry).map((e: any) => ({
      title: str(typeof e.title === "object" ? e.title["#text"] : e.title),
      source,
      published: toIso(e.published ?? e.updated),
    }));
  }
  throw new Error("unrecognized feed format (not RSS 2.0 or Atom)");
}

/**
 * RSS 2.0 + Atom feeds. Fetches every configured URL and merges items newest
 * first (interleaving sources). A failing feed is skipped unless all fail.
 */
export const rssConnector: Connector<RssConnectorConfig, RssData> = {
  kind: "rss",
  async fetch(cfg) {
    const urls = cfg.urls?.length ? cfg.urls : cfg.url ? [cfg.url] : [];
    if (!urls.length) throw new Error("no feed URL configured");

    const results = await Promise.allSettled(
      urls.map(async (url) => {
        const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
        if (!res.ok) throw new Error(`RSS ${res.status}: ${res.statusText}`);
        return parseFeed(await res.text());
      }),
    );

    const ok = results.filter((r) => r.status === "fulfilled") as PromiseFulfilledResult<Item[]>[];
    if (!ok.length) {
      const firstErr = results.find((r) => r.status === "rejected") as PromiseRejectedResult | undefined;
      throw new Error(firstErr ? String(firstErr.reason instanceof Error ? firstErr.reason.message : firstErr.reason) : "no feeds reachable");
    }

    const items = ok
      .flatMap((r) => r.value)
      .sort((a, b) => (b.published ?? "").localeCompare(a.published ?? ""))
      .slice(0, 30);
    return { items };
  },
};
