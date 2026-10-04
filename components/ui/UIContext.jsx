"use client";

import { createContext, useContext, useState } from "react";

const Ctx = createContext({ navOpen: false, setNavOpen: () => {} });

export function UIProvider({ children }) {
  const [navOpen, setNavOpen] = useState(false);
  return <Ctx.Provider value={{ navOpen, setNavOpen }}>{children}</Ctx.Provider>;
}

export const useUI = () => useContext(Ctx);
