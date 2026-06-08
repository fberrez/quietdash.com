import { join } from "node:path";
import type { AuthMode } from "@quietdash/shared";

const authMode = (process.env.AUTH_MODE ?? "single-password") as AuthMode;

export const config = {
  port: Number(process.env.QUIETDASH_PORT ?? 3000),
  /** Where the SQLite file lives. Default ./data relative to the run cwd. */
  dataDir: process.env.QUIETDASH_DATA_DIR ?? join(process.cwd(), "data"),
  authMode,
  instanceName: process.env.QUIETDASH_INSTANCE_NAME ?? "QuietDash",
  /**
   * 32-byte AES key (64 hex chars) encrypting connector API keys at rest (D9).
   * If unset, the secret store derives a stable key from the instance session
   * secret (zero-config self-host); set an explicit key for backup/portability.
   */
  secretKey: process.env.QUIETDASH_SECRET_KEY,
  /**
   * Phase 0 only: a fixed device token so `curl` and the device stub can pull
   * an image before the real pairing flow (Phase 1) exists. Seeded onto the
   * dev device. Replace with issued-on-approve tokens in Phase 1.
   */
  devDeviceToken: process.env.QUIETDASH_DEV_DEVICE_TOKEN ?? "dev-device-token-phase0",
};
