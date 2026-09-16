"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export interface User {
  name: string;
}

interface UserContextValue {
  user: User | null;
  login: (u: User | null) => void;
  logout: () => void;
}

const UserContext = createContext<UserContextValue | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("av_user");
      // localStorage is only readable on the client; hydrate the session once after mount
      // so the first client render still matches the server (no user).
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored) setUser(JSON.parse(stored));
    } catch {
      // ignore malformed/inaccessible storage
    }
  }, []);

  const login = (u: User | null) => {
    setUser(u);
    try {
      if (u) localStorage.setItem("av_user", JSON.stringify(u));
      else localStorage.removeItem("av_user");
    } catch {
      // ignore inaccessible storage
    }
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem("av_user");
    } catch {
      // ignore inaccessible storage
    }
  };

  return (
    <UserContext.Provider value={{ user, login, logout }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within a UserProvider");
  return ctx;
}
