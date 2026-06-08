import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { config } from "./config.js";
import { runMigrations } from "./db/migrator.js";
import { ensureInstance } from "./instance.js";
import { advertiseMdns } from "./mdns.js";
import { authRoutes } from "./routes/auth.js";
import { connectorRoutes } from "./routes/connectors.js";
import { dashboardRoutes } from "./routes/dashboards.js";
import { deviceRoutes } from "./routes/device.js";
import { deviceAdminRoutes } from "./routes/devices.js";
import { pairRoutes } from "./routes/pair.js";
import { playlistRoutes } from "./routes/playlists.js";
import { previewRoutes } from "./routes/preview.js";
import { taskRoutes } from "./routes/tasks.js";

runMigrations();
ensureInstance();

const app = new Hono();

app.get("/api/health", (c) => c.json({ ok: true }));
app.route("/api/auth", authRoutes); // setup, login, logout, me
app.route("/api/pair", pairRoutes); // init, status, lookup
app.route("/api/devices", deviceAdminRoutes); // list, approve, unpair (authed)
app.route("/api/devices", playlistRoutes); // :deviceId/playlist (authed)
app.route("/api/dashboards", dashboardRoutes); // CRUD (authed)
app.route("/api/connectors", connectorRoutes); // CRUD + test (authed)
app.route("/api/tasks", taskRoutes); // local todo lists/items (authed)
app.route("/api/preview", previewRoutes); // server-rendered preview (authed)
app.route("/api/device", deviceRoutes); // image (device token)

// Production: serve the built studio and SPA-fallback so client routes like
// /pair work on refresh. Dev uses the Vite server + /api proxy instead.
const studioDist = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "studio", "dist");
if (existsSync(studioDist)) {
  app.use("/*", serveStatic({ root: "../studio/dist" }));
  const indexHtml = readFileSync(join(studioDist, "index.html"), "utf8");
  app.get("*", (c) => c.html(indexHtml));
  console.log("  studio: serving built UI from apps/studio/dist");
}

serve({ fetch: app.fetch, port: config.port, hostname: "0.0.0.0" }, (info) => {
  console.log(`QuietDash server on http://0.0.0.0:${info.port}  (auth=${config.authMode})`);
  advertiseMdns(config.instanceName, info.port);
});
