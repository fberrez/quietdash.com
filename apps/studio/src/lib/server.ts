/**
 * Where the studio finds its server.
 *
 * Two modes, one codebase:
 * - Served-by-server (the self-host web path): the SPA is served from the
 *   server's own origin, so the API lives at relative `/api/...`. Base is "".
 *   Nothing here changes that path: no override, no VITE_STANDALONE -> base "".
 * - Standalone (a future Tauri desktop/mobile wrapper, or any build hosted
 *   apart from the server): the SPA loads from its own origin (tauri://…) and
 *   must call an absolute server URL on the LAN, chosen by the user.
 *
 * The server stays the headless brain on the Pi either way (DECISIONS D3/D7).
 * This module only decides which server URL the *client* talks to.
 */

const KEY = "quietdash.serverUrl";

/** Strip trailing slash so `base + "/api/x"` never doubles up. */
function normalize(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

/** The user-chosen server URL, or null if none has been set on this client. */
export function getStoredServerUrl(): string | null {
  try {
    const v = localStorage.getItem(KEY);
    return v ? normalize(v) : null;
  } catch {
    return null;
  }
}

export function setServerUrl(url: string): void {
  localStorage.setItem(KEY, normalize(url));
}

export function clearServerUrl(): void {
  localStorage.removeItem(KEY);
}

/**
 * True when this client needs an explicit server URL (it is not served by the
 * server it talks to). Set at build time for native wrappers, or implied once
 * the user has picked a server. The plain web build leaves both unset, so this
 * is false and the served-by-server path is byte-for-byte unchanged.
 */
export function isStandalone(): boolean {
  return import.meta.env.VITE_STANDALONE === "true" || getStoredServerUrl() !== null;
}

/**
 * Prefix for every API call. "" means same-origin relative requests (web);
 * an absolute origin means a standalone client pointed at a LAN server.
 */
export function getApiBase(): string {
  const stored = getStoredServerUrl();
  if (stored) return stored;
  const built = import.meta.env.VITE_API_BASE;
  return built ? normalize(built) : "";
}
