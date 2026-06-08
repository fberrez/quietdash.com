import { useCallback, useEffect, useState } from "react";
import { api, type ConnectorView } from "../lib/api";
import { Badge, Button, Field, Select, TextInput } from "../components/ui";

type Kind = "openweather" | "ics" | "rss";

const KIND_LABEL: Record<Kind, string> = { openweather: "Weather (OpenWeather)", ics: "Calendar (ICS URL)", rss: "Feed (RSS)" };

/** Summarize a connector's config for the list row. */
function summarize(c: ConnectorView): string {
  const cfg = c.config as { location?: string; urls?: string[]; url?: string };
  if (c.kind === "openweather") return cfg.location ?? "";
  const urls = cfg.urls ?? (cfg.url ? [cfg.url] : []);
  return `${urls.length} link${urls.length === 1 ? "" : "s"}`;
}

export function ConnectorsPage() {
  const [list, setList] = useState<ConnectorView[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const [kind, setKind] = useState<Kind>("openweather");
  const [label, setLabel] = useState("");
  const [location, setLocation] = useState("");
  const [urls, setUrls] = useState<string[]>([""]);
  const [secret, setSecret] = useState("");
  const [test, setTest] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    try {
      setList((await api.connectors()).connectors);
    } catch (e) {
      setErr((e as Error).message);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  const reset = () => {
    setLabel("");
    setLocation("");
    setUrls([""]);
    setSecret("");
    setTest(null);
  };

  const configFor = (): Record<string, unknown> =>
    kind === "openweather" ? { location } : { urls: urls.map((u) => u.trim()).filter(Boolean) };

  const setUrlAt = (i: number, v: string) => setUrls((prev) => prev.map((u, j) => (j === i ? v : u)));
  const addUrl = () => setUrls((prev) => [...prev, ""]);
  const removeUrl = (i: number) => setUrls((prev) => (prev.length === 1 ? prev : prev.filter((_, j) => j !== i)));

  const runTest = async () => {
    setTest("Testing…");
    const r = await api.testConnector(kind, configFor(), secret || undefined);
    setTest(r.ok ? "Connection OK" : `Failed: ${r.error}`);
  };

  const add = async () => {
    setBusy(true);
    setErr(null);
    try {
      await api.createConnector(kind, label || KIND_LABEL[kind], configFor(), secret || undefined);
      reset();
      await load();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const remove = async (id: string) => {
    if (confirm("Delete this connector? Widgets using it will show no data.")) {
      await api.deleteConnector(id);
      await load();
    }
  };

  return (
    <div className="space-y-8">
      <section>
        <h1 className="label text-ink-soft mb-3">Connectors</h1>
        {list.length === 0 ? (
          <p className="text-sm text-ink-soft">No connectors yet. Add one below to feed weather, calendar, or a feed.</p>
        ) : (
          <ul className="divide-y divide-line rounded-lg border border-line bg-card">
            {list.map((c) => (
              <li key={c.id} className="flex items-center justify-between px-4 py-3">
                <div>
                  <div className="font-medium">
                    {c.label} <Badge tone="soft">{c.kind}</Badge>
                  </div>
                  <div className="text-xs text-ink-soft">
                    {summarize(c)}
                    {c.secretMask ? ` · key ${c.secretMask}` : ""}
                  </div>
                </div>
                <Button variant="danger" onClick={() => remove(c.id)}>
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-lg border border-line bg-card p-5">
        <h2 className="label text-brick-deep mb-4">Add a connector</h2>
        {err && <p className="mb-3 text-sm text-brick-deep">{err}</p>}
        <div className="space-y-3">
          <Field label="Type">
            <Select value={kind} onChange={(e) => { setKind(e.target.value as Kind); reset(); }}>
              {(Object.keys(KIND_LABEL) as Kind[]).map((k) => (
                <option key={k} value={k}>
                  {KIND_LABEL[k]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Label">
            <TextInput placeholder={KIND_LABEL[kind]} value={label} onChange={(e) => setLabel(e.target.value)} />
          </Field>
          {kind === "openweather" ? (
            <>
              <Field label="Location">
                <TextInput placeholder="Paris,FR" value={location} onChange={(e) => setLocation(e.target.value)} />
              </Field>
              <Field label="API key">
                <TextInput type="password" placeholder="OpenWeather API key" value={secret} onChange={(e) => setSecret(e.target.value)} />
              </Field>
            </>
          ) : (
            <div role="group" aria-labelledby="urls-label">
              <span id="urls-label" className="mb-1 block text-xs font-medium text-ink-soft">
                {kind === "ics" ? "Calendar URLs" : "Feed URLs"}
              </span>
              <div className="space-y-2">
                {urls.map((u, i) => (
                  <div key={i} className="flex gap-2">
                    <TextInput
                      type="url"
                      aria-label={`${kind === "ics" ? "Calendar" : "Feed"} URL ${i + 1}`}
                      placeholder={kind === "ics" ? "https://…/basic.ics" : "https://…/feed.xml"}
                      value={u}
                      onChange={(e) => setUrlAt(i, e.target.value)}
                    />
                    {urls.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeUrl(i)}
                        aria-label={`Remove URL ${i + 1}`}
                        className="rounded-md px-2.5 text-sm text-ink-soft hover:text-brick-deep"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={addUrl} className="rounded-md py-1 text-sm text-brick-deep hover:underline">
                  + Add another {kind === "ics" ? "calendar" : "feed"}
                </button>
              </div>
            </div>
          )}
          {test && <p className={`text-sm ${test.startsWith("Connection OK") ? "text-ink" : "text-brick-deep"}`}>{test}</p>}
          <div className="flex gap-2">
            <Button variant="ghost" onClick={runTest}>
              Test connection
            </Button>
            <Button variant="accent" onClick={add} disabled={busy}>
              {busy ? "…" : "Add connector"}
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
