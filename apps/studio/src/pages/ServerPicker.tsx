import { useState } from "react";
import { Button, CenterCard, TextInput } from "../components/ui";
import { getStoredServerUrl, setServerUrl } from "../lib/server";

/**
 * Standalone-only: ask which server to talk to. Shown when a client hosted
 * apart from the server (e.g. Tauri) has no reachable server yet. The web path
 * served by the server never reaches this (its API is same-origin relative).
 */
export function ServerPicker({ onDone }: { onDone: () => void }) {
  const [url, setUrl] = useState(getStoredServerUrl() ?? "");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const base = url.trim().replace(/\/+$/, "");
    try {
      // Probe before persisting so a typo doesn't strand the app.
      const res = await fetch(`${base}/api/auth/me`, { credentials: "include" });
      if (!res.ok) throw new Error(`server responded ${res.status}`);
      await res.json();
      setServerUrl(base);
      onDone();
    } catch {
      setErr("Could not reach a QuietDash server at that address.");
      setBusy(false);
    }
  };

  return (
    <CenterCard title="Connect to your server" subtitle="Enter the address of your QuietDash server on the network.">
      <form onSubmit={submit} className="space-y-3">
        <TextInput
          type="url"
          inputMode="url"
          placeholder="http://quietdash.local:3000"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          autoFocus
        />
        {err && <p className="text-sm text-brick-deep">{err}</p>}
        <Button type="submit" variant="accent" disabled={busy || !url.trim()} className="w-full">
          {busy ? "…" : "Connect"}
        </Button>
      </form>
    </CenterCard>
  );
}
