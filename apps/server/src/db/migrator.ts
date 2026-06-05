import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { db } from "./index.js";

const migrationsFolder = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "drizzle");

/** Apply any pending SQL migrations from ./drizzle. Idempotent. */
export function runMigrations(): void {
  migrate(db, { migrationsFolder });
}
