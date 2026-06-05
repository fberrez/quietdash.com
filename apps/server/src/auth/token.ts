import { createHash, randomBytes } from "node:crypto";
import { PAIRING } from "@quietdash/shared";

/** Device tokens are stored as a sha256 hash; the plaintext lives only on the device. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Opaque 256-bit device token, issued on pairing approval. */
export function generateDeviceToken(): string {
  return randomBytes(32).toString("hex");
}

/** Short, single-use claim code shown on the panel (typed fallback for the QR). */
export function generateClaimCode(): string {
  const alphabet = PAIRING.CLAIM_CODE_ALPHABET;
  const bytes = randomBytes(PAIRING.CLAIM_CODE_LENGTH);
  let code = "";
  for (let i = 0; i < PAIRING.CLAIM_CODE_LENGTH; i++) {
    code += alphabet[bytes[i]! % alphabet.length];
  }
  return code;
}
