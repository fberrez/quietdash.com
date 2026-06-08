import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { config } from "./config.js";
import { getSessionSecret } from "./instance.js";

/**
 * Encryption at rest for connector API keys (D9). AES-256-GCM; the stored blob
 * is `iv:tag:ciphertext` (hex). The key comes from QUIETDASH_SECRET_KEY, or is
 * derived from the instance session secret when unset (zero-config self-host).
 *
 * Caveat: the derived fallback couples decryptability to the session secret,
 * which must therefore never be regenerated (it is generated once on first
 * boot and kept). A real install should set an explicit key.
 */

let cachedKey: Buffer | null = null;

function getKey(): Buffer {
  if (cachedKey) return cachedKey;
  const explicit = config.secretKey;
  if (explicit) {
    if (!/^[0-9a-fA-F]{64}$/.test(explicit)) {
      throw new Error("QUIETDASH_SECRET_KEY must be 64 hex characters (32 bytes)");
    }
    cachedKey = Buffer.from(explicit, "hex");
  } else {
    console.warn(
      "[secrets] QUIETDASH_SECRET_KEY not set; deriving a key from the session secret. " +
        "Set an explicit key for backup/portability.",
    );
    cachedKey = createHash("sha256").update(getSessionSecret()).digest();
  }
  return cachedKey;
}

export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey(), iv);
  const ct = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return [iv.toString("hex"), cipher.getAuthTag().toString("hex"), ct.toString("hex")].join(":");
}

export function decryptSecret(blob: string): string {
  const [ivH, tagH, ctH] = blob.split(":");
  if (!ivH || !tagH || !ctH) throw new Error("malformed secret blob");
  const decipher = createDecipheriv("aes-256-gcm", getKey(), Buffer.from(ivH, "hex"));
  decipher.setAuthTag(Buffer.from(tagH, "hex"));
  return Buffer.concat([decipher.update(Buffer.from(ctH, "hex")), decipher.final()]).toString("utf8");
}

/** For display: never return a plaintext key to the studio, show ••••last4. */
export function maskSecret(plain: string): string {
  return `••••${plain.slice(-4)}`;
}
