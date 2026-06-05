import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

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
  /** widget/layout config as JSON text; opaque in Phase 0 (fixed clock) */
  layout: text("layout", { mode: "json" }).notNull(),
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

/** Single-row instance config. */
export const settings = sqliteTable("settings", {
  id: integer("id").primaryKey(),
  instanceName: text("instance_name").notNull(),
  authMode: text("auth_mode").notNull().default("single-password"),
  /** HMAC secret for signed session cookies; generated on first boot */
  sessionSecret: text("session_secret"),
});
