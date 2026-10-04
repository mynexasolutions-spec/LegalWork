"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { CheckCircle2, XCircle, Info } from "lucide-react";

const Ctx = createContext(() => {});
const icons = {
  success: <CheckCircle2 size={18} className="text-emerald-500" />,
  error: <XCircle size={18} className="text-red-500" />,
  info: <Info size={18} className="text-sky-500" />,
};

export function ToastProvider({ children }) {
  const [items, setItems] = useState([]);

  const toast = useCallback((message, type = "success") => {
    const id = Math.random().toString(36).slice(2);
    setItems((l) => [...l, { id, message, type }]);
    setTimeout(() => setItems((l) => l.filter((t) => t.id !== id)), 3200);
  }, []);

  return (
    <Ctx.Provider value={toast}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[60] flex flex-col gap-2">
        {items.map((t) => (
          <div key={t.id} className="anim-slide-r pointer-events-auto flex max-w-sm items-center gap-3 rounded-xl border border-line bg-white px-4 py-3 text-sm shadow-lg">
            {icons[t.type]} <span>{t.message}</span>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);
