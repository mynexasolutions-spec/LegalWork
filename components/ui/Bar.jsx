"use client";

import { useEffect, useState } from "react";

// progress bar that grows from 0 on mount
export default function Bar({ pct, color = "bg-emerald-500", track = "bg-slate-100", height = "h-1.5" }) {
  const [w, setW] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setW(Math.max(0, Math.min(100, pct))), 80);
    return () => clearTimeout(t);
  }, [pct]);
  return (
    <div className={`${height} flex-1 overflow-hidden rounded-full ${track}`}>
      <div className={`h-full rounded-full transition-[width] duration-1000 ease-out ${color}`} style={{ width: `${w}%` }} />
    </div>
  );
}
