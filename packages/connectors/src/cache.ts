/**
 * In-memory read-through cache (a Pi reboot can cheaply refetch, so no SQLite).
 * Keyed by connector kind + owner + a hash of config. The min TTL also serves
 * as the rate-limit floor so many device pulls never hammer an external API.
 */
interface Entry {
  data: unknown;
  expires: number;
}

const store = new Map<string, Entry>();

export function cacheKey(...parts: string[]): string {
  return parts.join("|");
}

export async function readThrough<T>(key: string, ttlMs: number, now: Date, fn: () => Promise<T>): Promise<T> {
  const hit = store.get(key);
  if (hit && hit.expires > now.getTime()) return hit.data as T;
  const data = await fn();
  store.set(key, { data, expires: now.getTime() + ttlMs });
  return data;
}

/** Default per-kind TTLs (ms). */
export const TTL = {
  openweather: 10 * 60_000,
  ics: 15 * 60_000,
  rss: 15 * 60_000,
} as const;
