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
   * Phase 0 only: a fixed device token so `curl` and the device stub can pull
   * an image before the real pairing flow (Phase 1) exists. Seeded onto the
   * dev device. Replace with issued-on-approve tokens in Phase 1.
   */
  devDeviceToken: process.env.QUIETDASH_DEV_DEVICE_TOKEN ?? "dev-device-token-phase0",
};
