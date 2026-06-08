import { useCallback, useEffect, useState } from "react";
import { api, type ConnectorView } from "../lib/api";
import { Badge, Button, Field, Select, TextInput } from "../components/ui";

type Kind = "openweather" | "ics" | "rss";

const KIND_LABEL: Record<Kind, string> = { openweather: "Weather (OpenWeather)", ics: "Calendar (ICS URL)", rss: "Feed (RSS)" };

export function ConnectorsPage() {
  const [list, setList] = useState<ConnectorView[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const [kind, setKind] = useState<Kind>("openweather");
  const [label, setLabel] = useState("");
  const [location, setLocation] = useState("");
  const [url, setUrl] = useState("");
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

  const configFor = (): Record<string, unknown> => (kind === "openweather" ? { location } : { url });

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
      setLabel("");
      setLocation("");
      setUrl("");
      setSecret("");
      setTest(null);
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
        <h2 className="label text-ink-soft mb-3">Connectors</h2>
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
                    {String((c.config as { location?: string; url?: string }).location ?? (c.config as { url?: string }).url ?? "")}
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
        <h3 className="label text-brick mb-4">Add a connector</h3>
        {err && <p className="mb-3 text-sm text-brick-deep">{err}</p>}
        <div className="space-y-3">
          <Field label="Type">
            <Select value={kind} onChange={(e) => { setKind(e.target.value as Kind); setTest(null); }}>
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
            <Field label={kind === "ics" ? "ICS URL" : "Feed URL"}>
              <TextInput
                type="url"
                placeholder={kind === "ics" ? "https://…/basic.ics" : "https://…/feed.xml"}
                value={url}
                onChange={(e) => setUrl(e.target.value)}
              />
            </Field>
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
