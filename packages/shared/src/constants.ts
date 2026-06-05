/** Waveshare 7.5" V2 panel. 1-bit black & white is the brand (D10). */
export const DISPLAY = {
  WIDTH: 800,
  HEIGHT: 480,
  COLOR_MODE: "1bit",
} as const;

/** Default device pull cadence, seconds. Overridable per device later. */
export const DEFAULT_REFRESH_SECONDS = 300;

/** A device counts as "online" if seen within this multiple of its refresh interval. */
export const ONLINE_GRACE_MULTIPLIER = 2;

/** Pairing claim-code: short-lived, single-use, human-typable fallback. */
export const PAIRING = {
  CLAIM_CODE_LENGTH: 6,
  /** Excludes look-alikes (0/O, 1/I) for the typed fallback. */
  CLAIM_CODE_ALPHABET: "ABCDEFGHJKMNPQRSTUVWXYZ23456789",
  CLAIM_CODE_TTL_SECONDS: 600,
} as const;

/** mDNS service the server advertises and the device discovers (self-host LAN). */
export const MDNS_SERVICE_TYPE = "_quietdash._tcp";

export const AUTH_MODES = ["single-password", "multi-user"] as const;
export type AuthMode = (typeof AUTH_MODES)[number];

export const DEVICE_STATUSES = ["pending", "approved"] as const;
export type DeviceStatus = (typeof DEVICE_STATUSES)[number];

export const PAIRING_STATUSES = ["pending", "approved", "denied", "expired"] as const;
export type PairingStatus = (typeof PAIRING_STATUSES)[number];
