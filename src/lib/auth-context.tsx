"use client";

import { createContext, useEffect, useState, ReactNode } from "react";

export interface AuthClient {
  id: string;
  name?: string;
}

interface AuthContextValue {
  client: AuthClient | null;
  loading: boolean;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue>({
  client: null,
  loading: true,
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [client, setClient] = useState<AuthClient | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/portal/me")
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (data?.client_id) {
          setClient({ id: data.client_id, name: data.name });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const logout = async () => {
    await fetch("/api/portal/logout", { method: "POST" });
    setClient(null);
  };

  return (
    <AuthContext.Provider value={{ client, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
