import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { LAYOUT_SLOTS, WIDGET_TYPES, type DashboardLayout, type WidgetInstance, type WidgetType } from "@quietdash/shared";
import { api, type ConnectorView, type TaskList } from "../lib/api";
import { previewUrl } from "../lib/api";
import { Button, Field, Select, TextInput } from "../components/ui";
import { WIDGET_LABELS, WIDGET_NEEDS, defaultWidget } from "../lib/widgets";

const TZ = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

export function DashboardEditor() {
  const { id = "" } = useParams();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [layout, setLayout] = useState<DashboardLayout | null>(null);
  const [connectors, setConnectors] = useState<ConnectorView[]>([]);
  const [taskLists, setTaskLists] = useState<TaskList[]>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const [previewErr, setPreviewErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const lastUrl = useRef<string | null>(null);

  useEffect(() => {
    void (async () => {
      const [d, c, t] = await Promise.all([api.dashboard(id), api.connectors(), api.taskLists()]);
      setName(d.name);
      setLayout(d.layout);
      setConnectors(c.connectors);
      setTaskLists(t.lists);
    })();
  }, [id]);

  // Debounced server-rendered preview: the real 1-bit PNG, identical to device.
  useEffect(() => {
    if (!layout) return;
    const handle = setTimeout(async () => {
      try {
        const url = await previewUrl(layout, TZ);
        if (lastUrl.current) URL.revokeObjectURL(lastUrl.current);
        lastUrl.current = url;
        setPreview(url);
        setPreviewErr(null);
      } catch (e) {
        setPreviewErr((e as Error).message);
      }
    }, 400);
    return () => clearTimeout(handle);
  }, [layout]);

  const setSlot = useCallback((slot: string, widget: WidgetInstance | null) => {
    setSaved(false);
    setLayout((prev) => {
      if (!prev) return prev;
      const slots = { ...prev.slots };
      if (widget) slots[slot] = widget;
      else delete slots[slot];
      return { ...prev, slots };
    });
  }, []);

  const setConfig = useCallback((slot: string, key: string, value: unknown) => {
    setSaved(false);
    setLayout((prev) => {
      if (!prev) return prev;
      const inst = prev.slots[slot];
      if (!inst) return prev;
      const next = { ...inst, config: { ...(inst.config as Record<string, unknown>), [key]: value } } as WidgetInstance;
      return { ...prev, slots: { ...prev.slots, [slot]: next } };
    });
  }, []);

  const save = async () => {
    if (!layout) return;
    await api.updateDashboard(id, { name: name.trim() || "Untitled", layout });
    setSaved(true);
  };

  if (!layout) return <p className="text-sm text-ink-soft">Loading…</p>;
  const slots = LAYOUT_SLOTS[layout.layoutId];

  return (
    <div className="grid grid-cols-[1fr_420px] gap-8">
      <div className="space-y-5">
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Field label="Name">
              <TextInput value={name} onChange={(e) => { setName(e.target.value); setSaved(false); }} />
            </Field>
          </div>
          <Button variant="accent" onClick={save}>
            {saved ? "Saved" : "Save"}
          </Button>
          <Button variant="ghost" onClick={() => nav("/dashboards")}>
            Back
          </Button>
        </div>

        <div>
          <h3 className="label text-ink-soft mb-2">
            Slots · <span className="text-ink">{layout.layoutId}</span>
          </h3>
          <div className="space-y-4">
            {slots.map((slot) => {
              const inst = layout.slots[slot];
              return (
                <div key={slot} className="rounded-lg border border-line bg-card p-4">
                  <div className="mb-2 font-mono text-xs uppercase tracking-wide text-brick">{slot}</div>
                  <Field label="Widget">
                    <Select
                      value={inst?.type ?? ""}
                      onChange={(e) => {
                        const t = e.target.value as WidgetType | "";
                        if (!t) return setSlot(slot, null);
                        const need = WIDGET_NEEDS[t];
                        const firstConn = need && need !== "tasks" ? connectors.find((c) => c.kind === need)?.id ?? "" : "";
                        setSlot(slot, defaultWidget(t, firstConn));
                      }}
                    >
                      <option value="">(empty)</option>
                      {WIDGET_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {WIDGET_LABELS[t]}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  {inst && (
                    <div className="mt-3">
                      <WidgetConfig instance={inst} connectors={connectors} taskLists={taskLists} onChange={(k, v) => setConfig(slot, k, v)} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="label text-ink-soft">Preview</h3>
        <div className="rounded-lg border border-line bg-paper-sunk p-2">
          {preview ? (
            <img src={preview} width={400} height={240} alt="dashboard preview" className="w-full" style={{ imageRendering: "pixelated" }} />
          ) : (
            <div className="grid h-[240px] place-items-center text-sm text-ink-soft">Rendering…</div>
          )}
        </div>
        {previewErr && <p className="text-sm text-brick-deep">{previewErr}</p>}
        <p className="text-xs text-ink-soft">Exactly what the panel shows (800×480, 1-bit). Timezone: {TZ}.</p>
      </div>
    </div>
  );
}

function WidgetConfig({
  instance,
  connectors,
  taskLists,
  onChange,
}: {
  instance: WidgetInstance;
  connectors: ConnectorView[];
  taskLists: TaskList[];
  onChange: (key: string, value: unknown) => void;
}) {
  const cfg = instance.config as Record<string, unknown>;
  const connOf = (kind: string) => connectors.filter((c) => c.kind === kind);
  const num = (v: string, fallback: number) => (v === "" ? fallback : Number(v));

  const connectorField = (kind: string) => (
    <Field label="Connector">
      <Select value={String(cfg.connectorId ?? "")} onChange={(e) => onChange("connectorId", e.target.value)}>
        <option value="">(choose)</option>
        {connOf(kind).map((c) => (
          <option key={c.id} value={c.id}>
            {c.label}
          </option>
        ))}
      </Select>
    </Field>
  );

  switch (instance.type) {
    case "clock":
      return (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Format">
            <Select value={String(cfg.format)} onChange={(e) => onChange("format", e.target.value)}>
              <option value="24h">24h</option>
              <option value="12h">12h</option>
            </Select>
          </Field>
          <Field label="Seconds">
            <Select value={cfg.seconds ? "yes" : "no"} onChange={(e) => onChange("seconds", e.target.value === "yes")}>
              <option value="no">No</option>
              <option value="yes">Yes</option>
            </Select>
          </Field>
        </div>
      );
    case "date":
      return (
        <Field label="Style">
          <Select value={String(cfg.style)} onChange={(e) => onChange("style", e.target.value)}>
            <option value="long">Long</option>
            <option value="short">Short</option>
          </Select>
        </Field>
      );
    case "weather":
      return (
        <div className="grid grid-cols-2 gap-3">
          {connectorField("openweather")}
          <Field label="Units">
            <Select value={String(cfg.units)} onChange={(e) => onChange("units", e.target.value)}>
              <option value="metric">Celsius</option>
              <option value="imperial">Fahrenheit</option>
            </Select>
          </Field>
        </div>
      );
    case "agenda":
      return (
        <div className="grid grid-cols-2 gap-3">
          {connectorField("ics")}
          <Field label="Max events">
            <TextInput type="number" value={String(cfg.maxEvents)} onChange={(e) => onChange("maxEvents", num(e.target.value, 4))} />
          </Field>
        </div>
      );
    case "rss":
      return (
        <div className="grid grid-cols-2 gap-3">
          {connectorField("rss")}
          <Field label="Max items">
            <TextInput type="number" value={String(cfg.maxItems)} onChange={(e) => onChange("maxItems", num(e.target.value, 5))} />
          </Field>
        </div>
      );
    case "tasks":
      return (
        <div className="grid grid-cols-2 gap-3">
          <Field label="List">
            <Select value={String(cfg.listId ?? "")} onChange={(e) => onChange("listId", e.target.value || undefined)}>
              <option value="">(first list)</option>
              {taskLists.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Max items">
            <TextInput type="number" value={String(cfg.maxItems)} onChange={(e) => onChange("maxItems", num(e.target.value, 6))} />
          </Field>
        </div>
      );
    case "focus":
      return (
        <div className="grid grid-cols-2 gap-3">
          <Field label="Focus minutes">
            <TextInput type="number" value={String(cfg.workMinutes)} onChange={(e) => onChange("workMinutes", num(e.target.value, 25))} />
          </Field>
          <Field label="Break minutes">
            <TextInput type="number" value={String(cfg.breakMinutes)} onChange={(e) => onChange("breakMinutes", num(e.target.value, 5))} />
          </Field>
        </div>
      );
    case "notes":
      return (
        <Field label="Text">
          <TextInput value={String(cfg.text ?? "")} onChange={(e) => onChange("text", e.target.value)} />
        </Field>
      );
  }
}
