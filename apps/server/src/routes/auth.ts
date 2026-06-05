import { loginRequest, registerRequest, setupRequest } from "@quietdash/shared";
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { hashPassword, verifyPassword } from "../auth/password.js";
import { clearSession, currentUserId, setSession } from "../auth/session.js";
import { db } from "../db/index.js";
import { users } from "../db/schema.js";
import {
  createAccount,
  getInstanceSettings,
  getOwner,
  getUserByEmail,
  getUserById,
} from "../instance.js";

export const authRoutes = new Hono();

/** State the studio needs to decide register / setup / login / app. */
authRoutes.get("/me", async (c) => {
  const settings = getInstanceSettings();
  const userId = await currentUserId(c);
  const multiUser = settings.authMode === "multi-user";
  const email = userId ? (getUserById(userId)?.email ?? null) : null;
  return c.json({
    authMode: settings.authMode,
    instanceName: settings.instanceName,
    authenticated: userId != null,
    // single-password: false until the one password is set. multi-user: always true.
    setupComplete: multiUser ? true : getOwner().passwordHash != null,
    email,
  });
});

/** First-run single-password setup. Only valid in single-password mode. */
authRoutes.post("/setup", async (c) => {
  if (getInstanceSettings().authMode !== "single-password") return c.json({ error: "not available" }, 404);
  const owner = getOwner();
  if (owner.passwordHash) return c.json({ error: "already set up" }, 409);
  const parsed = setupRequest.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "password must be 8+ characters" }, 400);

  db.update(users).set({ passwordHash: hashPassword(parsed.data.password) }).where(eq(users.id, owner.id)).run();
  await setSession(c, owner.id);
  return c.json({ ok: true });
});

/** Create a cloud account. Only valid in multi-user mode. */
authRoutes.post("/register", async (c) => {
  if (getInstanceSettings().authMode !== "multi-user") return c.json({ error: "not available" }, 404);
  const parsed = registerRequest.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "valid email and 8+ char password required" }, 400);
  if (getUserByEmail(parsed.data.email)) return c.json({ error: "email already registered" }, 409);

  const user = createAccount(parsed.data.email, hashPassword(parsed.data.password));
  await setSession(c, user.id);
  return c.json({ ok: true });
});

authRoutes.post("/login", async (c) => {
  const parsed = loginRequest.safeParse(await c.req.json().catch(() => null));
  if (!parsed.success) return c.json({ error: "invalid request" }, 400);

  if (getInstanceSettings().authMode === "multi-user") {
    if (!parsed.data.email) return c.json({ error: "email required" }, 400);
    const user = getUserByEmail(parsed.data.email);
    if (!user?.passwordHash || !verifyPassword(parsed.data.password, user.passwordHash)) {
      return c.json({ error: "invalid credentials" }, 401);
    }
    await setSession(c, user.id);
    return c.json({ ok: true });
  }

  const owner = getOwner();
  if (!owner.passwordHash || !verifyPassword(parsed.data.password, owner.passwordHash)) {
    return c.json({ error: "invalid credentials" }, 401);
  }
  await setSession(c, owner.id);
  return c.json({ ok: true });
});

authRoutes.post("/logout", (c) => {
  clearSession(c);
  return c.json({ ok: true });
});
