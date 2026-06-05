import { deleteCookie, getSignedCookie, setSignedCookie } from "hono/cookie";
import { createMiddleware } from "hono/factory";
import type { Context } from "hono";
import { getSessionSecret } from "../instance.js";

const COOKIE = "qd_session";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export async function setSession(c: Context, userId: string): Promise<void> {
  await setSignedCookie(c, COOKIE, userId, getSessionSecret(), {
    httpOnly: true,
    sameSite: "Lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export function clearSession(c: Context): void {
  deleteCookie(c, COOKIE, { path: "/" });
}

export async function currentUserId(c: Context): Promise<string | null> {
  const value = await getSignedCookie(c, getSessionSecret(), COOKIE);
  return value ? value : null;
}

/** Gate for studio routes: requires a valid session, exposes c.get("userId"). */
export const requireAuth = createMiddleware<{ Variables: { userId: string } }>(async (c, next) => {
  const userId = await currentUserId(c);
  if (!userId) return c.json({ error: "unauthorized" }, 401);
  c.set("userId", userId);
  await next();
});
