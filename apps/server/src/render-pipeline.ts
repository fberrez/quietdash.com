import { createHash } from "node:crypto";
import { CONNECTORS, type ConnectorKind, TTL, cacheKey, readThrough } from "@quietdash/connectors";
import { type ResolvedSlotData, requiredDataSources } from "@quietdash/render";
import type { DashboardLayout, PlaylistEntry } from "@quietdash/shared";
import { and, asc, eq } from "drizzle-orm";
import { db } from "./db/index.js";
import { connectorConfigs, taskLists, tasks } from "./db/schema.js";
import { decryptSecret } from "./secrets.js";

/**
 * The render pipeline shared by the device image route and the studio preview,
 * so what you preview is byte-identical to what the panel shows (D7/D8).
 */

export interface PlaylistLike {
  timezone: string;
  defaultDashboardId: string | null;
  entries: PlaylistEntry[];
}

// --- timezone-aware schedule resolution ---

const DOW: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

function nowInTz(now: Date, tz: string): { minute: number; day: number } {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hourCycle: "h23",
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  const minute = Number(get("hour")) * 60 + Number(get("minute"));
  return { minute, day: DOW[get("weekday")] ?? 0 };
}

function inWindow(minute: number, start: number, end: number): boolean {
  return start <= end ? minute >= start && minute < end : minute >= start || minute < end;
}

/**
 * Pick the dashboard a playlist is showing right now: first entry whose weekday
 * + time window matches, else the default. Pure function over (playlist, now).
 */
export function resolveActiveDashboard(playlist: PlaylistLike | null, now: Date): string | null {
  if (!playlist) return null;
  const { minute, day } = nowInTz(now, playlist.timezone);
  for (const e of playlist.entries) {
    if (e.days.length && !e.days.includes(day)) continue;
    if (inWindow(minute, e.startMinute, e.endMinute)) return e.dashboardId;
  }
  return playlist.defaultDashboardId;
}

// --- per-slot data resolution (connectors + local tasks) ---

async function resolveConnector(ownerId: string, config: unknown, now: Date): Promise<unknown> {
  const connectorId = (config as { connectorId?: string }).connectorId;
  if (!connectorId) return null;
  const row = db
    .select()
    .from(connectorConfigs)
    .where(and(eq(connectorConfigs.id, connectorId), eq(connectorConfigs.ownerId, ownerId)))
    .get();
  if (!row) return null;

  const connector = CONNECTORS[row.kind as ConnectorKind];
  if (!connector) return null;
  const secret = row.secretEnc ? decryptSecret(row.secretEnc) : null;
  const key = cacheKey(row.kind, ownerId, createHash("sha1").update(JSON.stringify(row.config)).digest("hex"));
  const ttl = TTL[row.kind as ConnectorKind] ?? 10 * 60_000;
  return readThrough(key, ttl, now, () => connector.fetch(row.config, secret, { now }));
}

function resolveTasks(ownerId: string, config: unknown): { items: { title: string; done: boolean }[] } {
  const cfg = config as { listId?: string; maxItems?: number };
  const list = cfg.listId
    ? db.select().from(taskLists).where(and(eq(taskLists.id, cfg.listId), eq(taskLists.ownerId, ownerId))).get()
    : db.select().from(taskLists).where(eq(taskLists.ownerId, ownerId)).orderBy(asc(taskLists.createdAt)).get();
  if (!list) return { items: [] };
  const rows = db
    .select()
    .from(tasks)
    .where(and(eq(tasks.listId, list.id), eq(tasks.ownerId, ownerId)))
    .orderBy(asc(tasks.position), asc(tasks.createdAt))
    .all();
  return { items: rows.map((t) => ({ title: t.title, done: t.done })) };
}

/**
 * Resolve all data a layout needs. A failing connector yields null for its slot
 * (the widget renders "No data"), so one bad feed never blanks the panel.
 */
export async function resolveDashboardData(
  layout: DashboardLayout,
  ownerId: string,
  now: Date,
): Promise<ResolvedSlotData> {
  const sources = requiredDataSources(layout);
  const resolved: ResolvedSlotData = {};
  await Promise.all(
    sources.map(async (s) => {
      try {
        resolved[s.slot] = s.kind === "tasks" ? resolveTasks(ownerId, s.config) : await resolveConnector(ownerId, s.config, now);
      } catch {
        resolved[s.slot] = null;
      }
    }),
  );
  return resolved;
}
