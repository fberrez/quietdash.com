import { DEFAULT_REFRESH_SECONDS, ONLINE_GRACE_MULTIPLIER } from "@quietdash/shared";
import { and, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { requireAuth } from "../auth/session.js";
import { generateDeviceToken, hashToken } from "../auth/token.js";
import { db } from "../db/index.js";
import { devices, pairings } from "../db/schema.js";
import { defaultDashboardId } from "../instance.js";

export const deviceAdminRoutes = new Hono<{ Variables: { userId: string } }>();

deviceAdminRoutes.use("*", requireAuth);

const onlineWindowMs = ONLINE_GRACE_MULTIPLIER * DEFAULT_REFRESH_SECONDS * 1000;

/** GET /api/devices — the studio "connected devices" view, scoped to the owner. */
deviceAdminRoutes.get("/", (c) => {
  const ownerId = c.get("userId");
  const rows = db.select().from(devices).where(eq(devices.ownerId, ownerId)).orderBy(desc(devices.createdAt)).all();
  const now = Date.now();
  const view = rows.map((d) => ({
    id: d.id,
    name: d.name,
    status: d.status,
    online: d.lastSeenAt ? now - Date.parse(d.lastSeenAt) < onlineWindowMs : false,
    dashboardId: d.dashboardId,
    lastSeenAt: d.lastSeenAt,
    createdAt: d.createdAt,
  }));
  return c.json({ devices: view });
});

/** POST /api/devices/:id/approve — issue a token, bind the device to this owner. */
deviceAdminRoutes.post("/:id/approve", (c) => {
  const ownerId = c.get("userId");
  const id = c.req.param("id");
  const device = db.select().from(devices).where(eq(devices.id, id)).get();
  if (!device) return c.json({ error: "not found" }, 404);
  // Claim it for this account. Can't approve a device owned by someone else.
  if (device.ownerId && device.ownerId !== ownerId) {
    return c.json({ error: "device belongs to another account" }, 403);
  }

  const token = generateDeviceToken();
  db.update(devices)
    .set({
      status: "approved",
      ownerId,
      tokenHash: hashToken(token),
      dashboardId: device.dashboardId ?? defaultDashboardId(ownerId),
    })
    .where(eq(devices.id, id))
    .run();

  // Hand the plaintext token to the device's latest pairing for one-time delivery.
  const latest = db.select().from(pairings).where(eq(pairings.deviceId, id)).orderBy(desc(pairings.createdAt)).get();
  if (latest) {
    db.update(pairings).set({ status: "approved", deliveryToken: token }).where(eq(pairings.id, latest.id)).run();
  }

  return c.json({ ok: true });
});

/** POST /api/devices/:id/unpair — revoke. The device's token stops working. */
deviceAdminRoutes.post("/:id/unpair", (c) => {
  const ownerId = c.get("userId");
  const id = c.req.param("id");
  const device = db.select().from(devices).where(and(eq(devices.id, id), eq(devices.ownerId, ownerId))).get();
  if (!device) return c.json({ error: "not found" }, 404);
  db.delete(devices).where(eq(devices.id, id)).run();
  return c.json({ ok: true });
});
