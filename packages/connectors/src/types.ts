/**
 * Connectors are the server-side data layer (D9): fetch from an external
 * source, normalize to the shape the matching widget consumes. They are a pure
 * data layer — they never touch the DB or the environment. The server passes in
 * the (non-secret) config and the decrypted secret; caching/rate-limiting wrap
 * the call. No secret ever reaches the device.
 */
export interface ConnectorContext {
  now: Date;
}

export interface Connector<Cfg, Out> {
  kind: string;
  fetch(cfg: Cfg, secret: string | null, ctx: ConnectorContext): Promise<Out>;
}
