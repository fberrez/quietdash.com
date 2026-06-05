import { randomUUID } from "node:crypto";
import { PAIRING, pairInitRequest } from "@quietdash/shared";
import { and, desc, eq } from "drizzle-orm";
import { Hono } from "hono";
import { generateClaimCode } from "../auth/token.js";
import { requireAuth } from "../auth/session.js";
import { db } from "../db/index.js";
import { devices, pairings } from "../db/schema.js";
import { getInstanceSettings, getOwner } from "../instance.js";
import { rateLimit } from "../ratelimit.js";

export const pairRoutes = new Hono();

/**
 * POST /api/pair/init  (device -> server, public on the LAN)
 * Finds-or-creates a pending device for this fingerprint and opens a fresh
 * pairing with a short-lived claim code. The device shows the code as a QR.
 */
pairRoutes.post("/init", async (c) => {
  const parsed = pairInitRequest.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "invalid request" }, 400);
  const { name, fingerprint } = parsed.data;

  if (!rateLimit(`pair-init:${fingerprint}`, 5, 60_000)) {
    return c.json({ error: "too many attempts, slow down" }, 429);
  }

  // Dedup by fingerprint (a re-pairing device keeps its identity/owner).
  let device = db.select().from(devices).where(eq(devices.fingerprint, fingerprint)).get();

  if (!device) {
    // single-password: the one owner. multi-user: unclaimed until someone approves.
    const ownerId = getInstanceSettings().authMode === "single-password" ? getOwner().id : null;
    const id = randomUUID();
    db.insert(devices).values({ id, ownerId, name, fingerprint, status: "pending" }).run();
    device = db.select().from(devices).where(eq(devices.id, id)).get()!;
  }

  const pairingId = randomUUID();
  const claimCode = generateClaimCode();
  const expiresAt = new Date(Date.now() + PAIRING.CLAIM_CODE_TTL_SECONDS * 1000).toISOString();
  db.insert(pairings).values({ id: pairingId, deviceId: device.id, claimCode, status: "pending", expiresAt }).run();

  return c.json({ pairingId, claimCode, expiresAt });
});

/**
 * GET /api/pair/status?pairingId=  (device polls)
 * Returns the token exactly once, on the first poll after approval.
 */
pairRoutes.get("/status", (c) => {
  const pairingId = c.req.query("pairingId");
  if (!pairingId) return c.json({ error: "missing pairingId" }, 400);

  const pairing = db.select().from(pairings).where(eq(pairings.id, pairingId)).get();
  if (!pairing) return c.json({ error: "unknown pairing" }, 404);

  if (pairing.status === "pending" && new Date(pairing.expiresAt) < new Date()) {
    db.update(pairings).set({ status: "expired" }).where(eq(pairings.id, pairing.id)).run();
    return c.json({ status: "expired" });
  }

  if (pairing.status === "approved" && pairing.deliveryToken) {
    const token = pairing.deliveryToken;
    db.update(pairings).set({ deliveryToken: null }).where(eq(pairings.id, pairing.id)).run();
    return c.json({ status: "approved", token });
  }

  return c.json({ status: pairing.status });
});

/**
 * GET /api/pair/lookup?code=  (studio, authed)
 * Resolves a claim code from the QR to the pending device so the owner can
 * approve it. Scoped to the owner (cross-tenant safe).
 */
pairRoutes.get("/lookup", requireAuth, (c) => {
  const code = c.req.query("code");
  if (!code) return c.json({ error: "missing code" }, 400);

  const pairing = db.select().from(pairings).where(eq(pairings.claimCode, code)).orderBy(desc(pairings.createdAt)).get();
  if (!pairing) return c.json({ error: "unknown or expired code" }, 404);
  if (new Date(pairing.expiresAt) < new Date()) return c.json({ error: "code expired" }, 410);

  // Allow if unclaimed (anyone may claim it) or already owned by this account.
  const device = db.select().from(devices).where(eq(devices.id, pairing.deviceId)).get();
  if (!device || (device.ownerId && device.ownerId !== c.get("userId"))) {
    return c.json({ error: "not found" }, 404);
  }

  return c.json({
    pairingId: pairing.id,
    deviceId: device.id,
    deviceName: device.name,
    status: device.status,
    expiresAt: pairing.expiresAt,
  });
});
