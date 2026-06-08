import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LAYOUT_IDS, type LayoutId } from "@quietdash/shared";
import { api, type DashboardRow } from "../lib/api";
import { Badge, Button, Field, Select, TextInput } from "../components/ui";

const LAYOUT_LABEL: Record<LayoutId, string> = {
  "single-big": "Single (one big slot)",
  "desk-focus": "Desk Focus (main + side + footer)",
  agenda: "Agenda (header + list)",
  "split-2": "Split (two halves)",
  "grid-4": "Grid (2×2)",
};

export function DashboardsPage() {
  const nav = useNavigate();
  const [rows, setRows] = useState<DashboardRow[]>([]);
  const [name, setName] = useState("");
  const [layoutId, setLayoutId] = useState<LayoutId>("desk-focus");
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setRows((await api.dashboards()).dashboards);
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const create = async () => {
    setErr(null);
    try {
      const d = await api.createDashboard(name.trim() || "Untitled", { version: 1, layoutId, slots: {} });
      nav(`/dashboards/${d.id}`);
    } catch (e) {
      setErr((e as Error).message);
    }
  };
  const remove = async (id: string) => {
    if (confirm("Delete this dashboard?")) {
      await api.deleteDashboard(id);
      await load();
    }
  };

  return (
    <div className="space-y-8">
      <section>
        <h1 className="label text-ink-soft mb-3">Dashboards</h1>
        {rows.length === 0 ? (
          <p className="text-sm text-ink-soft">No dashboards yet. Create one below.</p>
        ) : (
          <ul className="divide-y divide-line rounded-lg border border-line bg-card">
            {rows.map((d) => (
              <li key={d.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <Link to={`/dashboards/${d.id}`} className="font-medium hover:text-brick-deep">
                    {d.name}
                  </Link>{" "}
                  <Badge tone="soft">{d.layout.layoutId}</Badge>
                </div>
                <div className="flex gap-2">
                  <Link to={`/dashboards/${d.id}`} className="rounded-md border border-line px-3 py-1.5 text-sm hover:bg-paper-sunk">
                    Edit
                  </Link>
                  <Button variant="danger" onClick={() => remove(d.id)}>
                    Delete
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-lg border border-line bg-card p-5">
        <h2 className="label text-brick-deep mb-4">New dashboard</h2>
        {err && <p className="mb-3 text-sm text-brick-deep">{err}</p>}
        <div className="space-y-3">
          <Field label="Name">
            <TextInput placeholder="Desk" value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Layout">
            <Select value={layoutId} onChange={(e) => setLayoutId(e.target.value as LayoutId)}>
              {LAYOUT_IDS.map((id) => (
                <option key={id} value={id}>
                  {LAYOUT_LABEL[id]}
                </option>
              ))}
            </Select>
          </Field>
          <Button variant="accent" onClick={create}>
            Create &amp; edit
          </Button>
        </div>
      </section>
    </div>
  );
}
