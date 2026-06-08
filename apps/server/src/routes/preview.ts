import { renderDashboardPng, renderErrorPng } from "@quietdash/render";
import { dashboardLayout } from "@quietdash/shared";
import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { requireAuth } from "../auth/session.js";
import { db } from "../db/index.js";
import { dashboards } from "../db/schema.js";
import { rateLimit } from "../ratelimit.js";
import { resolveDashboardData } from "../render-pipeline.js";

export const previewRoutes = new Hono<{ Variables: { userId: string } }>();
previewRoutes.use("*", requireAuth);

const body = z.object({
  layout: dashboardLayout.optional(),
  dashboardId: z.string().optional(),
  timezone: z.string().default("UTC"),
});

const png = (buf: Buffer) =>
  new Response(new Uint8Array(buf), { status: 200, headers: { "content-type": "image/png", "cache-control": "no-store" } });

/**
 * POST /api/preview — render a dashboard via the EXACT device path, so the
 * studio preview is byte-identical to the panel (D7/D8). Accepts an inline
 * layout (live editor) or a saved dashboardId. Rate-limited per owner since
 * each call rasters a full image.
 */
previewRoutes.post("/", async (c) => {
  const ownerId = c.get("userId");
  if (!rateLimit(`preview:${ownerId}`, 30, 60_000)) return c.json({ error: "too many previews, slow down" }, 429);

  const parsed = body.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "invalid request" }, 400);

  let layout = parsed.data.layout;
  if (!layout && parsed.data.dashboardId) {
    const row = db
      .select()
      .from(dashboards)
      .where(and(eq(dashboards.id, parsed.data.dashboardId), eq(dashboards.ownerId, ownerId)))
      .get();
    if (!row) return c.json({ error: "not found" }, 404);
    const reparsed = dashboardLayout.safeParse(row.layout);
    if (!reparsed.success) return png(await renderErrorPng("Dashboard layout is invalid"));
    layout = reparsed.data;
  }
  if (!layout) return c.json({ error: "layout or dashboardId required" }, 400);

  const now = new Date();
  const resolved = await resolveDashboardData(layout, ownerId, now);
  return png(await renderDashboardPng(layout, resolved, { now, timezone: parsed.data.timezone }));
});
