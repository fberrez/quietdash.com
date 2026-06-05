import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/**
 * scrypt password hashing (node:crypto, zero native deps, runs anywhere Node
 * does including the Pi). Format: scrypt$<saltHex>$<hashHex>. Fine for one
 * self-host password; argon2id is a possible upgrade for the cloud tier.
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [scheme, saltHex, hashHex] = stored.split("$");
  if (scheme !== "scrypt" || !saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const derived = scryptSync(password, Buffer.from(saltHex, "hex"), expected.length);
  return expected.length === derived.length && timingSafeEqual(expected, derived);
}
