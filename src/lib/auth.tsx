import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type AppUser = {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  profile?: Record<string, unknown> | null;
};

type AuthCtx = {
  user: AppUser | null;
  loading: boolean;
  signOut: () => void;
};

const Ctx = createContext<AuthCtx>({
  user: null,
  loading: true,
  signOut: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/user", { credentials: "include" })
      .then((r) => {
        if (r.status === 401) return null;
        return r.json();
      })
      .then((data) => {
        setUser(data ?? null);
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const signOut = () => {
    window.location.href = "/api/logout";
  };

  return (
    <Ctx.Provider value={{ user, loading, signOut }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
