import { useCallback, useEffect, useState } from "react";
import { api, type Me } from "./api";

/** Loads /api/auth/me and exposes a refresh() to re-check after setup/login. */
export function useSession() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setMe(await api.me());
    } catch {
      setMe(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { me, loading, refresh };
}
