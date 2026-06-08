import { dashboardLayout, layoutSlotErrors } from "@quietdash/shared";
import { randomUUID } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { requireAuth } from "../auth/session.js";
import { db } from "../db/index.js";
import { dashboards } from "../db/schema.js";

export const dashboardRoutes = new Hono<{ Variables: { userId: string } }>();
dashboardRoutes.use("*", requireAuth);

const createBody = z.object({ name: z.string().min(1).max(64), layout: dashboardLayout });
const updateBody = z.object({ name: z.string().min(1).max(64).optional(), layout: dashboardLayout.optional() });

/** Reject a layout whose slots don't belong to its layoutId. */
function slotCheck(layout: ReturnType<typeof dashboardLayout.parse>): string | null {
  const errs = layoutSlotErrors(layout);
  return errs.length ? errs.join("; ") : null;
}

dashboardRoutes.get("/", (c) => {
  const ownerId = c.get("userId");
  const rows = db.select().from(dashboards).where(eq(dashboards.ownerId, ownerId)).orderBy(desc(dashboards.createdAt)).all();
  return c.json({ dashboards: rows });
});

dashboardRoutes.get("/:id", (c) => {
  const ownerId = c.get("userId");
  const row = db
    .select()
    .from(dashboards)
    .where(and(eq(dashboards.id, c.req.param("id")), eq(dashboards.ownerId, ownerId)))
    .get();
  if (!row) return c.json({ error: "not found" }, 404);
  return c.json(row);
});

dashboardRoutes.post("/", async (c) => {
  const ownerId = c.get("userId");
  const parsed = createBody.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "invalid dashboard" }, 400);
  const slotErr = slotCheck(parsed.data.layout);
  if (slotErr) return c.json({ error: slotErr }, 400);

  const id = randomUUID();
  db.insert(dashboards).values({ id, ownerId, name: parsed.data.name, layout: parsed.data.layout }).run();
  return c.json(db.select().from(dashboards).where(eq(dashboards.id, id)).get(), 201);
});

dashboardRoutes.put("/:id", async (c) => {
  const ownerId = c.get("userId");
  const id = c.req.param("id");
  const existing = db.select().from(dashboards).where(and(eq(dashboards.id, id), eq(dashboards.ownerId, ownerId))).get();
  if (!existing) return c.json({ error: "not found" }, 404);

  const parsed = updateBody.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "invalid dashboard" }, 400);
  if (parsed.data.layout) {
    const slotErr = slotCheck(parsed.data.layout);
    if (slotErr) return c.json({ error: slotErr }, 400);
  }

  db.update(dashboards)
    .set({ ...(parsed.data.name ? { name: parsed.data.name } : {}), ...(parsed.data.layout ? { layout: parsed.data.layout } : {}) })
    .where(eq(dashboards.id, id))
    .run();
  return c.json(db.select().from(dashboards).where(eq(dashboards.id, id)).get());
});

dashboardRoutes.delete("/:id", (c) => {
  const ownerId = c.get("userId");
  const id = c.req.param("id");
  const existing = db.select().from(dashboards).where(and(eq(dashboards.id, id), eq(dashboards.ownerId, ownerId))).get();
  if (!existing) return c.json({ error: "not found" }, 404);
  db.delete(dashboards).where(eq(dashboards.id, id)).run();
  return c.json({ ok: true });
});
