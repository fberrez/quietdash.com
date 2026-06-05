import { z } from "zod";
import { PAIRING_STATUSES } from "./constants.js";

/** POST /api/pair/init  (device -> server) */
export const pairInitRequest = z.object({
  deviceId: z.string().min(1),
  name: z.string().min(1).max(64),
  fingerprint: z.string().min(1).max(128),
});
export type PairInitRequest = z.infer<typeof pairInitRequest>;

export const pairInitResponse = z.object({
  pairingId: z.string(),
  claimCode: z.string(),
  expiresAt: z.string(),
});
export type PairInitResponse = z.infer<typeof pairInitResponse>;

/** GET /api/pair/status?pairingId=  (device polls) */
export const pairStatusResponse = z.object({
  status: z.enum(PAIRING_STATUSES),
  /** present only when status === "approved" */
  token: z.string().optional(),
});
export type PairStatusResponse = z.infer<typeof pairStatusResponse>;

/** POST /api/setup  (first-run, single-password mode) */
export const setupRequest = z.object({
  password: z.string().min(8).max(256),
});
export type SetupRequest = z.infer<typeof setupRequest>;

/** POST /api/login */
export const loginRequest = z.object({
  /** ignored in single-password mode; required in multi-user */
  email: z.string().email().optional(),
  password: z.string().min(1),
});
export type LoginRequest = z.infer<typeof loginRequest>;

/** POST /api/auth/register  (multi-user / cloud only) */
export const registerRequest = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(256),
});
export type RegisterRequest = z.infer<typeof registerRequest>;

/** Device row as exposed to the studio "connected devices" view. */
export const deviceView = z.object({
  id: z.string(),
  name: z.string(),
  status: z.enum(["pending", "approved"]),
  online: z.boolean(),
  dashboardId: z.string().nullable(),
  lastSeenAt: z.string().nullable(),
  createdAt: z.string(),
});
export type DeviceView = z.infer<typeof deviceView>;
