"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const KEY = "lexpro-auth";
const COOKIE = "lexpro_session";
const Ctx = createContext(null);

// demo account shown on the login page
export const DEMO = { email: "demo@lexpro.com", password: "Demo@123", name: "Harsh Kumar", role: "Administrator" };

function setCookie(on, days = 7) {
  document.cookie = on
    ? `${COOKIE}=1; path=/; max-age=${days * 86400}; SameSite=Lax`
    : `${COOKIE}=; path=/; max-age=0; SameSite=Lax`;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY) ?? sessionStorage.getItem(KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {
      // unreadable session: treat as logged out
    }
    setReady(true);
  }, []);

  // returns an error message, or null when the login worked
  const login = useCallback((email, password, remember = true) => {
    if (email.trim().toLowerCase() !== DEMO.email || password !== DEMO.password) {
      return "Incorrect email or password. Use the demo credentials shown on this page.";
    }
    const u = { email: DEMO.email, name: DEMO.name, role: DEMO.role };
    try {
      (remember ? localStorage : sessionStorage).setItem(KEY, JSON.stringify(u));
    } catch {
      // storage blocked: session lasts until the tab state is lost
    }
    setCookie(true, remember ? 7 : 1);
    setUser(u);
    return null;
  }, []);

  const logout = useCallback(() => {
    try {
      localStorage.removeItem(KEY);
      sessionStorage.removeItem(KEY);
    } catch {
      // nothing to clear
    }
    setCookie(false);
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, ready, login, logout }), [user, ready, login, logout]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useAuth = () => useContext(Ctx);
