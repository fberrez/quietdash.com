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

import type { DashboardLayout, PlaylistConfig } from "@quietdash/shared";
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

export interface DashboardRow {
  id: string;
  ownerId: string;
  name: string;
  layout: DashboardLayout;
  createdAt: string;
}

export interface ConnectorView {
  id: string;
  kind: "openweather" | "ics" | "rss";
  label: string;
  config: Record<string, unknown>;
  secretMask: string | null;
  createdAt: string;
}

export interface TaskList {
  id: string;
  name: string;
  createdAt: string;
}
export interface TaskItem {
  id: string;
  listId: string;
  title: string;
  done: boolean;
  position: number;
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

  // dashboards
  dashboards: () => req<{ dashboards: DashboardRow[] }>("/api/dashboards"),
  dashboard: (id: string) => req<DashboardRow>(`/api/dashboards/${id}`),
  createDashboard: (name: string, layout: DashboardLayout) =>
    req<DashboardRow>("/api/dashboards", { method: "POST", body: JSON.stringify({ name, layout }) }),
  updateDashboard: (id: string, patch: { name?: string; layout?: DashboardLayout }) =>
    req<DashboardRow>(`/api/dashboards/${id}`, { method: "PUT", body: JSON.stringify(patch) }),
  deleteDashboard: (id: string) => req<{ ok: true }>(`/api/dashboards/${id}`, { method: "DELETE" }),

  // connectors
  connectors: () => req<{ connectors: ConnectorView[] }>("/api/connectors"),
  createConnector: (kind: string, label: string, config: Record<string, unknown>, secret?: string) =>
    req<ConnectorView>("/api/connectors", { method: "POST", body: JSON.stringify({ kind, label, config, secret }) }),
  deleteConnector: (id: string) => req<{ ok: true }>(`/api/connectors/${id}`, { method: "DELETE" }),
  testConnector: (kind: string, config: Record<string, unknown>, secret?: string) =>
    req<{ ok: boolean; sample?: unknown; error?: string }>("/api/connectors/test", {
      method: "POST",
      body: JSON.stringify({ kind, config, secret }),
    }),

  // tasks
  taskLists: () => req<{ lists: TaskList[] }>("/api/tasks/lists"),
  createTaskList: (name: string) => req<TaskList>("/api/tasks/lists", { method: "POST", body: JSON.stringify({ name }) }),
  deleteTaskList: (id: string) => req<{ ok: true }>(`/api/tasks/lists/${id}`, { method: "DELETE" }),
  taskItems: (listId: string) => req<{ items: TaskItem[] }>(`/api/tasks/lists/${listId}/items`),
  addTask: (listId: string, title: string) =>
    req<TaskItem>(`/api/tasks/lists/${listId}/items`, { method: "POST", body: JSON.stringify({ title }) }),
  updateTask: (id: string, patch: { title?: string; done?: boolean; position?: number }) =>
    req<TaskItem>(`/api/tasks/items/${id}`, { method: "PUT", body: JSON.stringify(patch) }),
  deleteTask: (id: string) => req<{ ok: true }>(`/api/tasks/items/${id}`, { method: "DELETE" }),

  // playlist (rotation)
  playlist: (deviceId: string) => req<PlaylistConfig>(`/api/devices/${deviceId}/playlist`),
  setPlaylist: (deviceId: string, cfg: PlaylistConfig) =>
    req<{ ok: true }>(`/api/devices/${deviceId}/playlist`, { method: "PUT", body: JSON.stringify(cfg) }),
};

/**
 * Server-rendered preview: POST a layout, get back the real 1-bit PNG as an
 * object URL (byte-identical to the device image). Caller revokes the URL.
 */
export async function previewUrl(layout: DashboardLayout, timezone: string): Promise<string> {
  const res = await fetch(getApiBase() + "/api/preview", {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ layout, timezone }),
  });
  if (!res.ok) {
    const e = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(e.error ?? `preview failed (${res.status})`);
  }
  return URL.createObjectURL(await res.blob());
}
