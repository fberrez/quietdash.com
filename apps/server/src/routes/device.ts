import { renderClockPng } from "@quietdash/render";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { hashToken } from "../auth/token.js";
import { db } from "../db/index.js";
import { devices } from "../db/schema.js";

export const deviceRoutes = new Hono();

/**
 * GET /api/device/image
 * Device pulls the current 1-bit PNG for its assigned dashboard.
 * Phase 0: authenticates the bearer token against an approved device, stamps
 * lastSeenAt (feeds the studio "connected devices" view), renders the clock.
 * Phase 1+: render the device's assigned dashboard layout, not a fixed clock.
 */
deviceRoutes.get("/image", async (c) => {
  const auth = c.req.header("authorization") ?? "";
  const token = /^bearer\s+/i.test(auth) ? auth.replace(/^bearer\s+/i, "") : "";
  if (!token) return c.json({ error: "missing bearer token" }, 401);

  const device = db.select().from(devices).where(eq(devices.tokenHash, hashToken(token))).get();
  if (!device || device.status !== "approved") {
    return c.json({ error: "unknown or unapproved device" }, 401);
  }

  db.update(devices)
    .set({ lastSeenAt: new Date().toISOString() })
    .where(eq(devices.id, device.id))
    .run();

  const png = await renderClockPng(new Date());
  return new Response(new Uint8Array(png), {
    status: 200,
    headers: { "content-type": "image/png", "cache-control": "no-store" },
  });
});
