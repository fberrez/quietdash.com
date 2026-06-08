import { randomUUID } from "node:crypto";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { requireAuth } from "../auth/session.js";
import { db } from "../db/index.js";
import { taskLists, tasks } from "../db/schema.js";

export const taskRoutes = new Hono<{ Variables: { userId: string } }>();
taskRoutes.use("*", requireAuth);

const ownsList = (ownerId: string, id: string) =>
  db.select().from(taskLists).where(and(eq(taskLists.id, id), eq(taskLists.ownerId, ownerId))).get();
const ownsTask = (ownerId: string, id: string) =>
  db.select().from(tasks).where(and(eq(tasks.id, id), eq(tasks.ownerId, ownerId))).get();

// --- lists ---

taskRoutes.get("/lists", (c) => {
  const ownerId = c.get("userId");
  const rows = db.select().from(taskLists).where(eq(taskLists.ownerId, ownerId)).orderBy(asc(taskLists.createdAt)).all();
  return c.json({ lists: rows });
});

taskRoutes.post("/lists", async (c) => {
  const ownerId = c.get("userId");
  const parsed = z.object({ name: z.string().min(1).max(64) }).safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "invalid list" }, 400);
  const id = randomUUID();
  db.insert(taskLists).values({ id, ownerId, name: parsed.data.name }).run();
  return c.json(db.select().from(taskLists).where(eq(taskLists.id, id)).get(), 201);
});

taskRoutes.delete("/lists/:id", (c) => {
  const ownerId = c.get("userId");
  if (!ownsList(ownerId, c.req.param("id"))) return c.json({ error: "not found" }, 404);
  db.delete(taskLists).where(eq(taskLists.id, c.req.param("id"))).run();
  return c.json({ ok: true });
});

// --- items ---

taskRoutes.get("/lists/:id/items", (c) => {
  const ownerId = c.get("userId");
  if (!ownsList(ownerId, c.req.param("id"))) return c.json({ error: "not found" }, 404);
  const rows = db
    .select()
    .from(tasks)
    .where(eq(tasks.listId, c.req.param("id")))
    .orderBy(asc(tasks.position), asc(tasks.createdAt))
    .all();
  return c.json({ items: rows });
});

taskRoutes.post("/lists/:id/items", async (c) => {
  const ownerId = c.get("userId");
  const listId = c.req.param("id");
  if (!ownsList(ownerId, listId)) return c.json({ error: "not found" }, 404);
  const parsed = z.object({ title: z.string().min(1).max(200) }).safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "invalid task" }, 400);
  const next = db.select({ m: sql<number>`coalesce(max(${tasks.position}), -1)` }).from(tasks).where(eq(tasks.listId, listId)).get();
  const id = randomUUID();
  db.insert(tasks).values({ id, ownerId, listId, title: parsed.data.title, position: (next?.m ?? -1) + 1 }).run();
  return c.json(db.select().from(tasks).where(eq(tasks.id, id)).get(), 201);
});

taskRoutes.put("/items/:id", async (c) => {
  const ownerId = c.get("userId");
  const id = c.req.param("id");
  if (!ownsTask(ownerId, id)) return c.json({ error: "not found" }, 404);
  const parsed = z
    .object({ title: z.string().min(1).max(200).optional(), done: z.boolean().optional(), position: z.number().int().optional() })
    .safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "invalid task" }, 400);
  db.update(tasks)
    .set({
      ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
      ...(parsed.data.done !== undefined ? { done: parsed.data.done } : {}),
      ...(parsed.data.position !== undefined ? { position: parsed.data.position } : {}),
    })
    .where(eq(tasks.id, id))
    .run();
  return c.json(db.select().from(tasks).where(eq(tasks.id, id)).get());
});

taskRoutes.delete("/items/:id", (c) => {
  const ownerId = c.get("userId");
  const id = c.req.param("id");
  if (!ownsTask(ownerId, id)) return c.json({ error: "not found" }, 404);
  db.delete(tasks).where(eq(tasks.id, id)).run();
  return c.json({ ok: true });
});
