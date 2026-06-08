import { randomBytes, randomUUID } from "node:crypto";
import { defaultDashboardLayout } from "@quietdash/shared";
import { eq } from "drizzle-orm";
import { config } from "./config.js";
import { db } from "./db/index.js";
import { dashboards, settings, users } from "./db/schema.js";

/**
 * Boot-time instance bootstrap. Idempotent.
 *
 * single-password (self-host): seed exactly one owner (password null until
 *   first-run setup) + one default dashboard.
 * multi-user (cloud): no seeded owner; each registered account gets its own
 *   user + default dashboard at register time.
 *
 * Either way: ensure a settings row and a session secret (D11).
 */
export function ensureInstance(): void {
  let s = db.select().from(settings).limit(1).get();
  if (!s) {
    db.insert(settings)
      .values({
        id: 1,
        instanceName: config.instanceName,
        authMode: config.authMode,
        sessionSecret: randomBytes(32).toString("hex"),
      })
      .run();
    s = db.select().from(settings).limit(1).get()!;
  } else if (!s.sessionSecret) {
    db.update(settings).set({ sessionSecret: randomBytes(32).toString("hex") }).where(eq(settings.id, s.id)).run();
  }

  if (config.authMode === "single-password") {
    let owner = db.select().from(users).limit(1).get();
    if (!owner) {
      const id = randomUUID();
      db.insert(users).values({ id, email: null, passwordHash: null }).run();
      owner = db.select().from(users).where(eq(users.id, id)).get()!;
    }
    const hasDashboard = db.select().from(dashboards).where(eq(dashboards.ownerId, owner.id)).limit(1).get();
    if (!hasDashboard) {
      db.insert(dashboards)
        .values({ id: randomUUID(), ownerId: owner.id, name: "Clock", layout: defaultDashboardLayout() })
        .run();
    }
  }
}

let cachedSecret: string | null = null;
export function getSessionSecret(): string {
  if (cachedSecret) return cachedSecret;
  cachedSecret = db.select().from(settings).limit(1).get()!.sessionSecret!;
  return cachedSecret;
}

export function getInstanceSettings() {
  return db.select().from(settings).limit(1).get()!;
}

/** The single owner (single-password only). */
export function getOwner() {
  return db.select().from(users).limit(1).get()!;
}

export function getUserByEmail(email: string) {
  return db.select().from(users).where(eq(users.email, email)).get();
}

export function getUserById(id: string) {
  return db.select().from(users).where(eq(users.id, id)).get();
}

/** Create a cloud account: a user plus their own default dashboard. */
export function createAccount(email: string, passwordHash: string) {
  const id = randomUUID();
  db.insert(users).values({ id, email, passwordHash }).run();
  db.insert(dashboards)
    .values({ id: randomUUID(), ownerId: id, name: "Clock", layout: defaultDashboardLayout() })
    .run();
  return db.select().from(users).where(eq(users.id, id)).get()!;
}

/** The owner's default dashboard id, for assigning to a device on approval. */
export function defaultDashboardId(ownerId: string): string | null {
  return db.select().from(dashboards).where(eq(dashboards.ownerId, ownerId)).limit(1).get()?.id ?? null;
}
