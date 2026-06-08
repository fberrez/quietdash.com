import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import type { DashboardLayout, PlaylistEntry } from "@quietdash/shared";

/**
 * Tenant-ready schema (D11). Every owned row carries `ownerId`.
 * Self-host seeds exactly one user and pins ownerId; cloud isolates per user.
 * The same schema serves both; only AUTH_MODE behaviour differs.
 */

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  /** null in single-password self-host mode; unique per account in multi-user */
  email: text("email").unique(),
  /** argon2id hash; null until first-run setup completes */
  passwordHash: text("password_hash"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
});

export const dashboards = sqliteTable("dashboards", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  /** curated layout + per-slot widget assignment (see @quietdash/shared) */
  layout: text("layout", { mode: "json" }).notNull().$type<DashboardLayout>(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
});

export const devices = sqliteTable("devices", {
  id: text("id").primaryKey(),
  /** null while unclaimed (multi-user); set to the approving account on pairing */
  ownerId: text("owner_id").references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  fingerprint: text("fingerprint").notNull(),
  /** "pending" until the owner approves, then "approved" */
  status: text("status").notNull().default("pending"),
  /** sha256 of the bearer token; null while pending */
  tokenHash: text("token_hash").unique(),
  dashboardId: text("dashboard_id").references(() => dashboards.id, {
    onDelete: "set null",
  }),
  lastSeenAt: text("last_seen_at"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
});

export const pairings = sqliteTable("pairings", {
  id: text("id").primaryKey(),
  deviceId: text("device_id")
    .notNull()
    .references(() => devices.id, { onDelete: "cascade" }),
  claimCode: text("claim_code").notNull(),
  status: text("status").notNull().default("pending"),
  /** plaintext device token, set on approval and cleared after one poll delivers it */
  deliveryToken: text("delivery_token"),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
});

/** Time-based rotation: one playlist per device (D-product-surface). */
export const playlists = sqliteTable("playlists", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  deviceId: text("device_id")
    .notNull()
    .unique()
    .references(() => devices.id, { onDelete: "cascade" }),
  timezone: text("timezone").notNull().default("UTC"),
  defaultDashboardId: text("default_dashboard_id").references(() => dashboards.id, { onDelete: "set null" }),
  /** ordered [{ dashboardId, days[], startMinute, endMinute }] */
  entries: text("entries", { mode: "json" }).notNull().$type<PlaylistEntry[]>(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
});

/** Per-owner connector config; the secret (API key) is encrypted at rest (D9). */
export const connectorConfigs = sqliteTable("connector_configs", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  /** "openweather" | "ics" | "rss" */
  kind: text("kind").notNull(),
  label: text("label").notNull(),
  /** non-secret config (location, url, ...) as JSON */
  config: text("config", { mode: "json" }).notNull().$type<Record<string, unknown>>(),
  /** AES-256-GCM blob "iv:tag:ciphertext"; null for keyless connectors (ics/rss) */
  secretEnc: text("secret_enc"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
});

/** Local todo lists (the tasks widget reads these; no external API). */
export const taskLists = sqliteTable("task_lists", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
});

export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey(),
  ownerId: text("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  listId: text("list_id")
    .notNull()
    .references(() => taskLists.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  done: integer("done", { mode: "boolean" }).notNull().default(false),
  position: integer("position").notNull().default(0),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
});

/** Single-row instance config. */
export const settings = sqliteTable("settings", {
  id: integer("id").primaryKey(),
  instanceName: text("instance_name").notNull(),
  authMode: text("auth_mode").notNull().default("single-password"),
  /** HMAC secret for signed session cookies; generated on first boot */
  sessionSecret: text("session_secret"),
});
