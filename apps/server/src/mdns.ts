import { createRequire } from "node:module";

// bonjour-service ships as CJS; its named export isn't statically resolvable
// under ESM, so load it through createRequire.
const require = createRequire(import.meta.url);
const { Bonjour } = require("bonjour-service") as typeof import("bonjour-service");

/**
 * Advertise the server as `_quietdash._tcp` on the LAN so devices can discover
 * it without configuration (self-host). All-in-one Pis discover themselves;
 * separate servers are found by their thin devices. Best-effort: multicast may
 * be unavailable (some Docker/network setups), which must not crash the server.
 */
export function advertiseMdns(name: string, port: number): () => void {
  try {
    const bonjour = new Bonjour();
    bonjour.publish({ name, type: "quietdash", port, txt: { v: "1" } });
    console.log(`  mdns: advertising _quietdash._tcp as "${name}" on :${port}`);
    return () => bonjour.destroy();
  } catch (err) {
    console.warn(`  mdns: advertise failed (${String(err)}); discovery disabled`);
    return () => {};
  }
}
