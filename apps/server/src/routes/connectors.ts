import { CONNECTORS, type ConnectorKind } from "@quietdash/connectors";
import { randomUUID } from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { z } from "zod";
import { requireAuth } from "../auth/session.js";
import { db } from "../db/index.js";
import { connectorConfigs } from "../db/schema.js";
import { decryptSecret, encryptSecret, maskSecret } from "../secrets.js";

export const connectorRoutes = new Hono<{ Variables: { userId: string } }>();
connectorRoutes.use("*", requireAuth);

const KINDS = ["openweather", "ics", "rss"] as const;

const createBody = z.object({
  kind: z.enum(KINDS),
  label: z.string().min(1).max(64),
  config: z.record(z.unknown()),
  secret: z.string().min(1).optional(),
});
const updateBody = z.object({
  label: z.string().min(1).max(64).optional(),
  config: z.record(z.unknown()).optional(),
  /** new plaintext key; omit to keep, empty string to clear */
  secret: z.string().optional(),
});
const testBody = z.object({
  kind: z.enum(KINDS),
  config: z.record(z.unknown()),
  secret: z.string().optional(),
});

/** Public view: secret is never returned, only whether one is set + last 4. */
function view(row: typeof connectorConfigs.$inferSelect) {
  return {
    id: row.id,
    kind: row.kind,
    label: row.label,
    config: row.config,
    secretMask: row.secretEnc ? maskSecret(decryptSecret(row.secretEnc)) : null,
    createdAt: row.createdAt,
  };
}

connectorRoutes.get("/", (c) => {
  const ownerId = c.get("userId");
  const rows = db.select().from(connectorConfigs).where(eq(connectorConfigs.ownerId, ownerId)).orderBy(desc(connectorConfigs.createdAt)).all();
  return c.json({ connectors: rows.map(view) });
});

connectorRoutes.post("/", async (c) => {
  const ownerId = c.get("userId");
  const parsed = createBody.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "invalid connector" }, 400);
  const id = randomUUID();
  db.insert(connectorConfigs)
    .values({
      id,
      ownerId,
      kind: parsed.data.kind,
      label: parsed.data.label,
      config: parsed.data.config,
      secretEnc: parsed.data.secret ? encryptSecret(parsed.data.secret) : null,
    })
    .run();
  return c.json(view(db.select().from(connectorConfigs).where(eq(connectorConfigs.id, id)).get()!), 201);
});

connectorRoutes.put("/:id", async (c) => {
  const ownerId = c.get("userId");
  const id = c.req.param("id");
  const existing = db.select().from(connectorConfigs).where(and(eq(connectorConfigs.id, id), eq(connectorConfigs.ownerId, ownerId))).get();
  if (!existing) return c.json({ error: "not found" }, 404);
  const parsed = updateBody.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "invalid connector" }, 400);

  const secretEnc =
    parsed.data.secret === undefined ? existing.secretEnc : parsed.data.secret === "" ? null : encryptSecret(parsed.data.secret);
  db.update(connectorConfigs)
    .set({
      ...(parsed.data.label ? { label: parsed.data.label } : {}),
      ...(parsed.data.config ? { config: parsed.data.config } : {}),
      secretEnc,
    })
    .where(eq(connectorConfigs.id, id))
    .run();
  return c.json(view(db.select().from(connectorConfigs).where(eq(connectorConfigs.id, id)).get()!));
});

connectorRoutes.delete("/:id", (c) => {
  const ownerId = c.get("userId");
  const id = c.req.param("id");
  const existing = db.select().from(connectorConfigs).where(and(eq(connectorConfigs.id, id), eq(connectorConfigs.ownerId, ownerId))).get();
  if (!existing) return c.json({ error: "not found" }, 404);
  db.delete(connectorConfigs).where(eq(connectorConfigs.id, id)).run();
  return c.json({ ok: true });
});

/**
 * POST /api/connectors/test — validate a connector before (or after) saving.
 * For a saved connector, pass {kind, config} and omit secret to reuse the
 * stored key by also sending its id; simplest path: send the plaintext.
 */
connectorRoutes.post("/test", async (c) => {
  const parsed = testBody.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ ok: false, error: "invalid request" }, 400);
  const connector = CONNECTORS[parsed.data.kind as ConnectorKind];
  try {
    const sample = await connector.fetch(parsed.data.config, parsed.data.secret ?? null, { now: new Date() });
    return c.json({ ok: true, sample });
  } catch (e) {
    return c.json({ ok: false, error: (e as Error).message });
  }
});
