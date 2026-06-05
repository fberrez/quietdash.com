import { mkdirSync } from "node:fs";
import { join } from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { config } from "../config.js";
import * as schema from "./schema.js";

mkdirSync(config.dataDir, { recursive: true });

const sqlite = new Database(join(config.dataDir, "quietdash.db"));
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });
export { schema };
