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
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const Ctx = createContext<AuthCtx>({
  user: null,
  loading: true,
  signOut: async () => {},
  refreshUser: async () => {},
});

async function fetchUser(): Promise<AppUser | null> {
  try {
    const r = await fetch("/api/auth/user", { credentials: "include" });
    if (r.status === 401) return null;
    return r.json();
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const data = await fetchUser();
    setUser(data);
  };

  useEffect(() => {
    fetchUser().then((data) => {
      setUser(data);
      setLoading(false);
    });
  }, []);

  const signOut = async () => {
    await fetch("/api/logout", { method: "POST", credentials: "include" });
    setUser(null);
    window.location.href = "/login";
  };

  return (
    <Ctx.Provider value={{ user, loading, signOut, refreshUser }}>
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);
