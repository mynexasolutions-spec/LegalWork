"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FiMoreVertical } from "react-icons/fi";

// items: [{ label, icon, onClick, danger, hidden, divider }]
// The menu is portalled and fixed-positioned so scrolling tables don't clip it.
export default function RowMenu({ items, label = "More actions", className = "rounded-md p-2 text-slate-700 hover:bg-slate-100" }) {
  const [pos, setPos] = useState(null);
  const btn = useRef(null);
  const visible = items.filter((i) => !i.hidden);

  useEffect(() => {
    if (!pos) return;
    const close = () => setPos(null);
    const onKey = (e) => e.key === "Escape" && close();
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
      document.removeEventListener("keydown", onKey);
    };
  }, [pos]);

  const toggle = (e) => {
    e.stopPropagation();
    if (pos) return setPos(null);
    const r = btn.current.getBoundingClientRect();
    const height = visible.length * 40 + 12;
    const up = r.bottom + height > window.innerHeight - 8;
    setPos({ right: window.innerWidth - r.right, top: up ? undefined : r.bottom + 6, bottom: up ? window.innerHeight - r.top + 6 : undefined });
  };

  return (
    <>
      <button ref={btn} onClick={toggle} aria-label={label} aria-haspopup="menu" aria-expanded={!!pos} className={className}>
        <FiMoreVertical size={16} />
      </button>
      {pos &&
        createPortal(
          <>
            <div className="fixed inset-0 z-40" onMouseDown={() => setPos(null)} />
            <div role="menu" className="anim-drop fixed z-50 min-w-48 rounded-xl border border-line bg-white p-1.5 shadow-xl" style={pos}>
              {visible.map((item, i) => {
                const Icon = item.icon;
                return (
                  <div key={item.label + i}>
                    {item.divider && <hr className="my-1 border-line" />}
                    <button
                      role="menuitem"
                      onClick={(e) => { e.stopPropagation(); setPos(null); item.onClick(); }}
                      className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm hover:bg-slate-50 ${item.danger ? "text-red-600 hover:bg-red-50" : "text-slate-700"}`}
                    >
                      {Icon && <Icon size={15} />} {item.label}
                    </button>
                  </div>
                );
              })}
            </div>
          </>,
          document.body
        )}
    </>
  );
}
