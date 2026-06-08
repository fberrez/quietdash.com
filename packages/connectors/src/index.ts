import { icsConnector } from "./ics.js";
import { openWeatherConnector } from "./openweather.js";
import { rssConnector } from "./rss.js";
import type { Connector } from "./types.js";

export type { Connector, ConnectorContext } from "./types.js";
export type { OpenWeatherConfig } from "./openweather.js";
export type { IcsConfig } from "./ics.js";
export type { RssConnectorConfig } from "./rss.js";
export { openWeatherConnector } from "./openweather.js";
export { icsConnector } from "./ics.js";
export { rssConnector } from "./rss.js";
export { readThrough, cacheKey, TTL } from "./cache.js";

/** Connector kinds that read external sources (the local "tasks" kind is not here). */
export type ConnectorKind = "openweather" | "ics" | "rss";

/** Dispatch table the server uses to resolve a widget's dataSource. */
export const CONNECTORS: Record<ConnectorKind, Connector<any, unknown>> = {
  openweather: openWeatherConnector,
  ics: icsConnector,
  rss: rssConnector,
};
