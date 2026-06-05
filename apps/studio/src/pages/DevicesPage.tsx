import { useCallback, useEffect, useState } from "react";
import { api, type DeviceView } from "../lib/api";
import { Badge, Button } from "../components/ui";

function relativeTime(iso: string | null): string {
  if (!iso) return "never";
  const secs = Math.round((Date.now() - Date.parse(iso)) / 1000);
  if (secs < 60) return `${secs}s ago`;
  if (secs < 3600) return `${Math.round(secs / 60)}m ago`;
  if (secs < 86400) return `${Math.round(secs / 3600)}h ago`;
  return `${Math.round(secs / 86400)}d ago`;
}

export function DevicesPage() {
  const [devices, setDevices] = useState<DeviceView[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setDevices((await api.devices()).devices);
      setErr(null);
    } catch (e) {
      setErr((e as Error).message);
    }
  }, []);

  useEffect(() => {
    void load();
    const t = setInterval(load, 3000);
    return () => clearInterval(t);
  }, [load]);

  const approve = async (id: string) => {
    await api.approve(id);
    void load();
  };
  const unpair = async (id: string) => {
    if (confirm("Unpair this device? Its token stops working immediately.")) {
      await api.unpair(id);
      void load();
    }
  };

  const pending = devices?.filter((d) => d.status === "pending") ?? [];
  const approved = devices?.filter((d) => d.status === "approved") ?? [];

  return (
    <div className="space-y-8">
      {err && <p className="text-sm text-brick-deep">{err}</p>}

      {pending.length > 0 && (
        <section>
          <h2 className="label text-brick mb-3">Waiting to pair</h2>
          <ul className="space-y-2">
            {pending.map((d) => (
              <li key={d.id} className="flex items-center justify-between rounded-lg border border-brick/30 bg-brick/5 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{d.name}</span> <Badge tone="brick">pending</Badge>
                </div>
                <Button variant="accent" onClick={() => approve(d.id)}>
                  Approve
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="label text-ink-soft mb-3">Devices</h2>
        {approved.length === 0 ? (
          <p className="text-sm text-ink-soft">
            No devices yet. Power on a panel: it shows a QR, you scan it and approve here.
          </p>
        ) : (
          <ul className="divide-y divide-line rounded-lg border border-line bg-card">
            {approved.map((d) => (
              <li key={d.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className={`h-2 w-2 rounded-full ${d.online ? "bg-brick" : "bg-line"}`} />
                  <div>
                    <div className="font-medium">{d.name}</div>
                    <div className="text-xs text-ink-soft">
                      {d.online ? "online" : "offline"} · seen {relativeTime(d.lastSeenAt)}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={d.online ? "ink" : "soft"}>{d.online ? "online" : "offline"}</Badge>
                  <Button variant="danger" onClick={() => unpair(d.id)}>
                    Unpair
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
