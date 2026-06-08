import { renderDashboardPng, renderErrorPng } from "@quietdash/render";
import { dashboardLayout } from "@quietdash/shared";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { hashToken } from "../auth/token.js";
import { db } from "../db/index.js";
import { dashboards, devices, playlists } from "../db/schema.js";
import { resolveActiveDashboard, resolveDashboardData } from "../render-pipeline.js";

export const deviceRoutes = new Hono();

const png = (buf: Buffer) =>
  new Response(new Uint8Array(buf), {
    status: 200,
    headers: { "content-type": "image/png", "cache-control": "no-store" },
  });

/**
 * GET /api/device/image
 * The device pulls the 1-bit PNG for whatever dashboard is active right now:
 * authenticate the bearer token, stamp lastSeenAt (feeds the studio "online"
 * view), resolve the active dashboard (playlist schedule -> default -> the
 * device's assigned dashboard), resolve its data, render. A bad layout or no
 * assignment yields a clean error card, never a blank panel.
 */
deviceRoutes.get("/image", async (c) => {
  const auth = c.req.header("authorization") ?? "";
  const token = /^bearer\s+/i.test(auth) ? auth.replace(/^bearer\s+/i, "") : "";
  if (!token) return c.json({ error: "missing bearer token" }, 401);

  const device = db.select().from(devices).where(eq(devices.tokenHash, hashToken(token))).get();
  if (!device || device.status !== "approved" || !device.ownerId) {
    return c.json({ error: "unknown or unapproved device" }, 401);
  }

  db.update(devices).set({ lastSeenAt: new Date().toISOString() }).where(eq(devices.id, device.id)).run();

  const now = new Date();
  const playlist = db.select().from(playlists).where(eq(playlists.deviceId, device.id)).get() ?? null;
  const dashboardId = resolveActiveDashboard(playlist, now) ?? device.dashboardId;
  if (!dashboardId) return png(await renderErrorPng("No dashboard assigned to this device"));

  const dash = db.select().from(dashboards).where(eq(dashboards.id, dashboardId)).get();
  if (!dash) return png(await renderErrorPng("Assigned dashboard was removed"));

  const parsed = dashboardLayout.safeParse(dash.layout);
  if (!parsed.success) return png(await renderErrorPng("Dashboard layout is invalid"));

  const resolved = await resolveDashboardData(parsed.data, device.ownerId, now);
  const image = await renderDashboardPng(parsed.data, resolved, { now, timezone: playlist?.timezone ?? "UTC" });
  return png(image);
});
