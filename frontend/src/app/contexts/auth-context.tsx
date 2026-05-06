import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiJson } from "@/app/api/http";
import type { AuthLoginResponse, AuthMeResponse, MesUser } from "@/app/api/types";
import { clearMesSession } from "@/app/lib/auth-storage";

type AuthContextValue = {
  user: MesUser | null;
  isReady: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MesUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  const refreshMe = useCallback(async () => {
    try {
      const { user: u } = await apiJson<AuthMeResponse>("/api/v1/auth/me");
      setUser(u);
    } catch {
      clearMesSession();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      await refreshMe();
      if (!cancelled) setIsReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshMe]);

  useEffect(() => {
    const onExpired = () => {
      setUser(null);
    };
    window.addEventListener("mes-auth-expired", onExpired);
    return () => window.removeEventListener("mes-auth-expired", onExpired);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const body = { username: username.trim(), password };
    const res = await apiJson<AuthLoginResponse>("/api/v1/auth/login", {
      method: "POST",
      body: JSON.stringify(body),
    });
    setUser(res.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiJson<{ ok: boolean }>("/api/v1/auth/logout", { method: "POST" });
    } catch {
      /* vẫn xóa phiên cục bộ */
    }
    clearMesSession();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, isReady, login, logout, refreshMe }),
    [user, isReady, login, logout, refreshMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
