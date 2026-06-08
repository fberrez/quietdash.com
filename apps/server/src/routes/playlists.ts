import { playlistConfig } from "@quietdash/shared";
import { randomUUID } from "node:crypto";
import { and, eq, inArray } from "drizzle-orm";
import { Hono } from "hono";
import { requireAuth } from "../auth/session.js";
import { db } from "../db/index.js";
import { dashboards, devices, playlists } from "../db/schema.js";

export const playlistRoutes = new Hono<{ Variables: { userId: string } }>();
playlistRoutes.use("*", requireAuth);

const ownsDevice = (ownerId: string, deviceId: string) =>
  db.select().from(devices).where(and(eq(devices.id, deviceId), eq(devices.ownerId, ownerId))).get();

/** GET the device's playlist, or an empty default if none is set yet. */
playlistRoutes.get("/:deviceId/playlist", (c) => {
  const ownerId = c.get("userId");
  const deviceId = c.req.param("deviceId");
  if (!ownsDevice(ownerId, deviceId)) return c.json({ error: "not found" }, 404);
  const row = db.select().from(playlists).where(eq(playlists.deviceId, deviceId)).get();
  if (!row) return c.json({ timezone: "UTC", defaultDashboardId: null, entries: [] });
  return c.json({ timezone: row.timezone, defaultDashboardId: row.defaultDashboardId, entries: row.entries });
});

/** PUT the device's playlist. All referenced dashboards must belong to the owner. */
playlistRoutes.put("/:deviceId/playlist", async (c) => {
  const ownerId = c.get("userId");
  const deviceId = c.req.param("deviceId");
  if (!ownsDevice(ownerId, deviceId)) return c.json({ error: "not found" }, 404);

  const parsed = playlistConfig.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "invalid playlist" }, 400);

  const refs = [...parsed.data.entries.map((e) => e.dashboardId), ...(parsed.data.defaultDashboardId ? [parsed.data.defaultDashboardId] : [])];
  if (refs.length) {
    const owned = db.select({ id: dashboards.id }).from(dashboards).where(and(eq(dashboards.ownerId, ownerId), inArray(dashboards.id, refs))).all();
    const ownedSet = new Set(owned.map((d) => d.id));
    const bad = refs.find((id) => !ownedSet.has(id));
    if (bad) return c.json({ error: "playlist references a dashboard you don't own" }, 400);
  }

  const existing = db.select().from(playlists).where(eq(playlists.deviceId, deviceId)).get();
  if (existing) {
    db.update(playlists)
      .set({ timezone: parsed.data.timezone, defaultDashboardId: parsed.data.defaultDashboardId, entries: parsed.data.entries })
      .where(eq(playlists.id, existing.id))
      .run();
  } else {
    db.insert(playlists)
      .values({
        id: randomUUID(),
        ownerId,
        deviceId,
        timezone: parsed.data.timezone,
        defaultDashboardId: parsed.data.defaultDashboardId,
        entries: parsed.data.entries,
      })
      .run();
  }
  return c.json({ ok: true });
});
