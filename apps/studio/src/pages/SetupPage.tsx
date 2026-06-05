import { useState } from "react";
import { api } from "../lib/api";
import { Button, CenterCard, TextInput } from "../components/ui";

export function SetupPage({ onDone }: { onDone: () => void }) {
  const [pw, setPw] = useState("");
  const [pw2, setPw2] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 8) return setErr("Password must be at least 8 characters.");
    if (pw !== pw2) return setErr("Passwords don't match.");
    setBusy(true);
    setErr(null);
    try {
      await api.setup(pw);
      onDone();
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <CenterCard title="Set a password" subtitle="One password protects this QuietDash. You can change it later.">
      <form onSubmit={submit} className="space-y-3">
        <TextInput type="password" placeholder="New password" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus />
        <TextInput type="password" placeholder="Confirm password" value={pw2} onChange={(e) => setPw2(e.target.value)} />
        {err && <p className="text-sm text-brick-deep">{err}</p>}
        <Button type="submit" variant="accent" disabled={busy} className="w-full">
          {busy ? "Setting up…" : "Continue"}
        </Button>
      </form>
    </CenterCard>
  );
}
