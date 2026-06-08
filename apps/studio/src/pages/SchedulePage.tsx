import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import type { PlaylistConfig, PlaylistEntry } from "@quietdash/shared";
import { api, type DashboardRow } from "../lib/api";
import { Button, Field, Select } from "../components/ui";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const toTime = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
const toMin = (s: string) => {
  const [h, m] = s.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
};
const TZ = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

export function SchedulePage() {
  const { deviceId = "" } = useParams();
  const nav = useNavigate();
  const [dashboards, setDashboards] = useState<DashboardRow[]>([]);
  const [cfg, setCfg] = useState<PlaylistConfig | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void (async () => {
      const [d, p] = await Promise.all([api.dashboards(), api.playlist(deviceId)]);
      setDashboards(d.dashboards);
      setCfg({ timezone: p.timezone || TZ, defaultDashboardId: p.defaultDashboardId, entries: p.entries });
    })();
  }, [deviceId]);

  if (!cfg) return <p className="text-sm text-ink-soft">Loading…</p>;
  const patch = (p: Partial<PlaylistConfig>) => { setCfg({ ...cfg, ...p }); setSaved(false); };
  const setEntry = (i: number, e: PlaylistEntry) => patch({ entries: cfg.entries.map((x, j) => (j === i ? e : x)) });

  const addEntry = () =>
    patch({ entries: [...cfg.entries, { dashboardId: dashboards[0]?.id ?? "", days: [], startMinute: 540, endMinute: 1020 }] });
  const removeEntry = (i: number) => patch({ entries: cfg.entries.filter((_, j) => j !== i) });

  const save = async () => {
    await api.setPlaylist(deviceId, cfg);
    setSaved(true);
  };

  const dashName = (id: string) => dashboards.find((d) => d.id === id)?.name ?? "(choose)";

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="label text-ink-soft">Rotation schedule</h2>
        <div className="flex gap-2">
          <Button variant="accent" onClick={save}>
            {saved ? "Saved" : "Save"}
          </Button>
          <Button variant="ghost" onClick={() => nav("/")}>
            Back
          </Button>
        </div>
      </div>

      <p className="text-sm text-ink-soft">
        The panel shows the first matching window; outside all windows it falls back to the default. No windows means it always
        shows the default.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Timezone">
          <Select value={cfg.timezone} onChange={(e) => patch({ timezone: e.target.value })}>
            <option value={TZ}>{TZ}</option>
            <option value="UTC">UTC</option>
          </Select>
        </Field>
        <Field label="Default dashboard">
          <Select value={cfg.defaultDashboardId ?? ""} onChange={(e) => patch({ defaultDashboardId: e.target.value || null })}>
            <option value="">(none)</option>
            {dashboards.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="space-y-3">
        {cfg.entries.map((e, i) => (
          <div key={i} className="rounded-lg border border-line bg-card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Window {i + 1} · {dashName(e.dashboardId)}</span>
              <button onClick={() => removeEntry(i)} className="text-xs text-ink-soft hover:text-brick-deep">
                remove
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Dashboard">
                <Select value={e.dashboardId} onChange={(ev) => setEntry(i, { ...e, dashboardId: ev.target.value })}>
                  {dashboards.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="From">
                <input
                  type="time"
                  value={toTime(e.startMinute)}
                  onChange={(ev) => setEntry(i, { ...e, startMinute: toMin(ev.target.value) })}
                  className="w-full rounded-md border border-line bg-card px-3 py-2 text-sm"
                />
              </Field>
              <Field label="To">
                <input
                  type="time"
                  value={toTime(e.endMinute)}
                  onChange={(ev) => setEntry(i, { ...e, endMinute: toMin(ev.target.value) })}
                  className="w-full rounded-md border border-line bg-card px-3 py-2 text-sm"
                />
              </Field>
            </div>
            <div className="flex flex-wrap gap-2">
              {DAYS.map((d, di) => {
                const on = e.days.includes(di);
                return (
                  <button
                    key={d}
                    onClick={() => setEntry(i, { ...e, days: on ? e.days.filter((x) => x !== di) : [...e.days, di] })}
                    className={`rounded-md px-2 py-1 text-xs ${on ? "bg-ink text-paper" : "border border-line text-ink-soft"}`}
                  >
                    {d}
                  </button>
                );
              })}
              <span className="self-center text-xs text-ink-soft">{e.days.length === 0 ? "every day" : ""}</span>
            </div>
          </div>
        ))}
        <Button variant="ghost" onClick={addEntry} disabled={dashboards.length === 0}>
          + Add window
        </Button>
      </div>
    </div>
  );
}
