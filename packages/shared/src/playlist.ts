import { z } from "zod";

/**
 * Time-based rotation (issue #1 product surface). A device's playlist is an
 * ordered list of windows; the server resolves the active dashboard at render
 * time from its own clock + the playlist timezone. Empty entries / no match
 * falls back to `defaultDashboardId`, then to the device's `dashboardId`.
 */

/** Minutes since local midnight, 0..1440. A window may wrap (start > end). */
const minuteOfDay = z.number().int().min(0).max(1440);

export const playlistEntry = z.object({
  dashboardId: z.string().min(1),
  /** active weekdays, 0=Sun..6=Sat; empty means every day */
  days: z.array(z.number().int().min(0).max(6)).default([]),
  startMinute: minuteOfDay,
  endMinute: minuteOfDay,
});
export type PlaylistEntry = z.infer<typeof playlistEntry>;

/** GET/PUT /api/devices/:deviceId/playlist body. */
export const playlistConfig = z.object({
  timezone: z.string().min(1).default("UTC"),
  defaultDashboardId: z.string().nullable().default(null),
  entries: z.array(playlistEntry).default([]),
});
export type PlaylistConfig = z.infer<typeof playlistConfig>;
