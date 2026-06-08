import type { AuthMode, DeviceStatus } from "./constants.js";
import type { DashboardLayout } from "./layout.js";

/**
 * Tenant-ready domain model (D11). Every owned resource carries `ownerId`.
 * Self-host seeds exactly one user and pins ownerId to it; cloud lets users
 * register and isolates by ownerId. Same schema for both.
 */

export interface User {
  id: string;
  /** null in single-password self-host mode */
  email: string | null;
  createdAt: string;
}

export interface Dashboard {
  id: string;
  ownerId: string;
  name: string;
  /** Curated layout + per-slot widget assignment (see ./layout). */
  layout: DashboardLayout;
  createdAt: string;
}

export interface Device {
  id: string;
  /** null while unclaimed; set to the approving account on pairing */
  ownerId: string | null;
  name: string;
  /** Stable hardware-derived id the device sends at pair time. */
  fingerprint: string;
  status: DeviceStatus;
  /** Which dashboard this panel renders. null until assigned. */
  dashboardId: string | null;
  /** ISO timestamp of the last successful image pull. null if never seen. */
  lastSeenAt: string | null;
  createdAt: string;
}

export interface InstanceSettings {
  instanceName: string;
  authMode: AuthMode;
}
