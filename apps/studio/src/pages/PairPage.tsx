import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, type PairingLookup } from "../lib/api";
import { Button } from "../components/ui";

type State = "loading" | "ready" | "approved" | "error";

/** Landed here from the QR on the panel: /pair?code=XYZ12. */
export function PairPage() {
  const [params] = useSearchParams();
  const code = params.get("code");
  const [lookup, setLookup] = useState<PairingLookup | null>(null);
  const [state, setState] = useState<State>("loading");
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!code) {
      setState("error");
      setErr("No pairing code in the link.");
      return;
    }
    try {
      const r = await api.lookup(code);
      setLookup(r);
      setState(r.status === "approved" ? "approved" : "ready");
    } catch (e) {
      setState("error");
      setErr((e as Error).message);
    }
  }, [code]);

  useEffect(() => {
    void load();
  }, [load]);

  const approve = async () => {
    if (!lookup) return;
    try {
      await api.approve(lookup.deviceId);
      setState("approved");
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  return (
    <div className="mx-auto max-w-sm rounded-xl border border-line bg-card p-6 text-center">
      <div className="label text-brick mb-3">Pair a panel</div>
      {state === "loading" && <p className="text-sm text-ink-soft">Checking code…</p>}

      {state === "ready" && lookup && (
        <>
          <h2 className="text-xl">Pair this panel?</h2>
          <p className="mt-2 text-sm text-ink-soft">
            A device named <span className="font-medium text-ink">{lookup.deviceName}</span> wants to join.
          </p>
          <Button variant="accent" onClick={approve} className="mt-5 w-full">
            Approve
          </Button>
        </>
      )}

      {state === "approved" && (
        <>
          <h2 className="text-xl">Approved</h2>
          <p className="mt-2 text-sm text-ink-soft">
            The panel will connect within a few seconds and start showing your dashboard.
          </p>
          <Link
            to="/"
            className="mt-5 inline-block rounded-md bg-ink px-3.5 py-2 text-sm font-medium text-paper transition hover:opacity-90"
          >
            View your devices
          </Link>
        </>
      )}

      {state === "error" && (
        <>
          <h2 className="text-xl">Couldn't pair</h2>
          <p className="mt-2 text-sm text-brick-deep">{err}</p>
          <p className="mt-2 text-xs text-ink-soft">Codes expire after 10 minutes. Restart the panel for a fresh one.</p>
        </>
      )}
    </div>
  );
}
