import { Navigate, Route, Routes } from "react-router-dom";
import { api } from "./lib/api";
import { clearServerUrl, getStoredServerUrl, isStandalone } from "./lib/server";
import { useSession } from "./lib/useSession";
import { Button } from "./components/ui";
import { AuthScreen } from "./pages/AuthScreen";
import { DevicesPage } from "./pages/DevicesPage";
import { LoginPage } from "./pages/LoginPage";
import { PairPage } from "./pages/PairPage";
import { ServerPicker } from "./pages/ServerPicker";
import { SetupPage } from "./pages/SetupPage";

export function App() {
  const { me, loading, refresh } = useSession();

  if (loading) {
    return <div className="min-h-screen grid place-items-center bg-paper text-sm text-ink-soft">…</div>;
  }
  if (!me) {
    // Standalone clients (e.g. Tauri) point themselves at a LAN server; an
    // unreachable server means "pick one". The served-by-server web build can
    // only mean the server is actually down, so it keeps the plain message.
    if (isStandalone()) return <ServerPicker onDone={refresh} />;
    return <div className="min-h-screen grid place-items-center bg-paper text-sm text-brick-deep">server unreachable</div>;
  }
  // Gate everything (incl. /pair?code) behind auth; the URL is preserved, so
  // after auth the user lands back on the page they came in on.
  if (me.authMode === "multi-user") {
    if (!me.authenticated) return <AuthScreen onDone={refresh} />;
  } else {
    if (!me.setupComplete) return <SetupPage onDone={refresh} />;
    if (!me.authenticated) return <LoginPage onDone={refresh} />;
  }

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="border-b border-line px-6 py-4 flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <span className="label text-brick">QuietDash</span>
          {me.instanceName !== "QuietDash" && (
            <h1 className="text-lg text-ink-soft">{me.instanceName}</h1>
          )}
        </div>
        <div className="flex items-center gap-3">
          {isStandalone() && getStoredServerUrl() && (
            <button
              className="text-sm text-ink-soft hover:text-brick-deep transition"
              title="Connect to a different server"
              onClick={() => {
                clearServerUrl();
                refresh();
              }}
            >
              {getStoredServerUrl()?.replace(/^https?:\/\//, "")}
            </button>
          )}
          {me.email && <span className="text-sm text-ink-soft">{me.email}</span>}
          <Button
            variant="ghost"
            onClick={async () => {
              await api.logout();
              refresh();
            }}
          >
            Log out
          </Button>
        </div>
      </header>
      <main className="px-6 py-8 max-w-2xl mx-auto">
        <Routes>
          <Route path="/" element={<DevicesPage />} />
          <Route path="/pair" element={<PairPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}
