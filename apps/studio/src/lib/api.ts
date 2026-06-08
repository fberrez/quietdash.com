/**
 * Thin fetch wrappers for the studio.
 *
 * Requests are prefixed with the configured server base (empty for the
 * served-by-server web path, an absolute LAN URL for standalone clients; see
 * lib/server.ts). `credentials: "include"` sends the session cookie both
 * same-origin and cross-origin. Note: cross-origin cookies additionally need
 * the server on TLS with `SameSite=None; Secure` plus CORS-with-credentials;
 * that is the auth work a real standalone/Tauri build depends on (Phase 3),
 * not yet wired here.
 */

import { getApiBase } from "./server";

export interface Me {
  setupComplete: boolean;
  authenticated: boolean;
  instanceName: string;
  authMode: "single-password" | "multi-user";
  email: string | null;
}

export interface DeviceView {
  id: string;
  name: string;
  status: "pending" | "approved";
  online: boolean;
  dashboardId: string | null;
  lastSeenAt: string | null;
  createdAt: string;
}

export interface PairingLookup {
  pairingId: string;
  deviceId: string;
  deviceName: string;
  status: "pending" | "approved";
  expiresAt: string;
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(getApiBase() + path, {
    ...init,
    credentials: "include",
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
  const body = (await res.json().catch(() => ({}))) as T & { error?: string };
  if (!res.ok) throw new Error(body.error ?? `request failed (${res.status})`);
  return body;
}

export const api = {
  me: () => req<Me>("/api/auth/me"),
  setup: (password: string) =>
    req<{ ok: true }>("/api/auth/setup", { method: "POST", body: JSON.stringify({ password }) }),
  register: (email: string, password: string) =>
    req<{ ok: true }>("/api/auth/register", { method: "POST", body: JSON.stringify({ email, password }) }),
  login: (password: string, email?: string) =>
    req<{ ok: true }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(email ? { email, password } : { password }),
    }),
  logout: () => req<{ ok: true }>("/api/auth/logout", { method: "POST" }),
  devices: () => req<{ devices: DeviceView[] }>("/api/devices"),
  approve: (id: string) => req<{ ok: true }>(`/api/devices/${id}/approve`, { method: "POST" }),
  unpair: (id: string) => req<{ ok: true }>(`/api/devices/${id}/unpair`, { method: "POST" }),
  lookup: (code: string) => req<PairingLookup>(`/api/pair/lookup?code=${encodeURIComponent(code)}`),
};
