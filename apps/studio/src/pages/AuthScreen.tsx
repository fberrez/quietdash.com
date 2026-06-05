import { useState } from "react";
import { api } from "../lib/api";
import { Button, CenterCard, TextInput } from "../components/ui";

/** Multi-user (cloud) entry: create an account or log into one. */
export function AuthScreen({ onDone }: { onDone: () => void }) {
  const [mode, setMode] = useState<"login" | "register">("register");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      if (mode === "register") await api.register(email, pw);
      else await api.login(pw, email);
      onDone();
    } catch (e) {
      setErr((e as Error).message);
      setBusy(false);
    }
  };

  const isRegister = mode === "register";
  return (
    <CenterCard
      title={isRegister ? "Create account" : "Log in"}
      subtitle={isRegister ? "Your devices and dashboards live under your account." : "Welcome back."}
    >
      <form onSubmit={submit} className="space-y-3">
        <TextInput
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoFocus
        />
        <TextInput
          type="password"
          placeholder={isRegister ? "Password (8+ characters)" : "Password"}
          value={pw}
          onChange={(e) => setPw(e.target.value)}
        />
        {err && <p className="text-sm text-brick-deep">{err}</p>}
        <Button type="submit" variant="accent" disabled={busy} className="w-full">
          {busy ? "…" : isRegister ? "Create account" : "Log in"}
        </Button>
      </form>
      <p className="mt-4 text-sm text-ink-soft">
        {isRegister ? "Already have an account?" : "Need an account?"}{" "}
        <button
          type="button"
          className="font-medium text-brick hover:text-brick-deep"
          onClick={() => {
            setErr(null);
            setMode(isRegister ? "login" : "register");
          }}
        >
          {isRegister ? "Log in" : "Create one"}
        </button>
      </p>
    </CenterCard>
  );
}
