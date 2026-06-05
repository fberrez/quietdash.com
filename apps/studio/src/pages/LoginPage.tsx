import { useState } from "react";
import { api } from "../lib/api";
import { Button, CenterCard, TextInput } from "../components/ui";

export function LoginPage({ onDone }: { onDone: () => void }) {
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await api.login(pw);
      onDone();
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <CenterCard title="Log in" subtitle="Enter your password.">
      <form onSubmit={submit} className="space-y-3">
        <TextInput type="password" placeholder="Password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus />
        {err && <p className="text-sm text-brick-deep">{err}</p>}
        <Button type="submit" variant="accent" disabled={busy} className="w-full">
          {busy ? "…" : "Log in"}
        </Button>
      </form>
    </CenterCard>
  );
}
