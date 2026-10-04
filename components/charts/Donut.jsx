"use client";

import { useState } from "react";
import { INK } from "@/lib/charts";

const SIZE = 184;
const THICK = 26;

function arc(c, R, r, a0, a1) {
  const p = (rad, a) => [c + rad * Math.cos(a), c + rad * Math.sin(a)];
  const [x0, y0] = p(R, a0), [x1, y1] = p(R, a1), [x2, y2] = p(r, a1), [x3, y3] = p(r, a0);
  const big = a1 - a0 > Math.PI ? 1 : 0;
  return `M${x0} ${y0} A${R} ${R} 0 ${big} 1 ${x1} ${y1} L${x2} ${y2} A${r} ${r} 0 ${big} 0 ${x3} ${y3} Z`;
}

// slices: [{ key, label, value, color }]
export default function Donut({ slices, selected, onSelect, centerLabel = "Total", ariaLabel }) {
  const [hover, setHover] = useState(null);
  const [tip, setTip] = useState(null);
  const total = slices.reduce((a, s) => a + s.value, 0);
  const live = slices.filter((s) => s.value > 0);
  const c = SIZE / 2;
  const R = c - 6;
  const r = R - THICK;
  const gap = live.length > 1 ? 0.05 : 0; // angular gap = the surface spacer between segments

  let a = -Math.PI / 2;
  const arcs = live.map((s) => {
    const sweep = (s.value / total) * Math.PI * 2;
    const a0 = a + gap / 2;
    const a1 = a + sweep - gap / 2;
    a += sweep;
    return { ...s, a0, a1, mid: (a0 + a1) / 2 };
  });

  const focus = hover ?? selected;
  const shown = slices.find((s) => s.key === focus);
  const pct = (v) => (total ? Math.round((v / total) * 100) : 0);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} role="img" aria-label={ariaLabel} className="overflow-visible">
          {total === 0 && <circle cx={c} cy={c} r={(R + r) / 2} fill="none" stroke={INK.grid} strokeWidth={THICK} />}
          {arcs.length === 1 ? (
            <circle className="chart-slice cursor-pointer" cx={c} cy={c} r={(R + r) / 2} fill="none" stroke={arcs[0].color} strokeWidth={THICK} onPointerEnter={() => setHover(arcs[0].key)} onPointerLeave={() => setHover(null)} onClick={() => onSelect?.(selected === arcs[0].key ? null : arcs[0].key)} />
          ) : (
            arcs.map((s, i) => {
              const grow = hover === s.key || selected === s.key ? 4 : 0;
              const dim = focus && focus !== s.key ? 0.35 : 1;
              return (
                <path
                  key={s.key}
                  className="chart-slice cursor-pointer"
                  d={arc(c, R, r, s.a0, s.a1)}
                  fill={s.color}
                  opacity={dim}
                  tabIndex={0}
                  role="button"
                  aria-label={`${s.label}: ${s.value} (${pct(s.value)}%)`}
                  style={{ transform: `translate(${Math.cos(s.mid) * grow}px, ${Math.sin(s.mid) * grow}px)`, transition: "transform .18s ease, opacity .18s ease", animationDelay: `${i * 0.12}s` }}
                  onPointerEnter={() => setHover(s.key)}
                  onPointerMove={(e) => { const b = e.currentTarget.ownerSVGElement.getBoundingClientRect(); setTip({ x: e.clientX - b.left, y: e.clientY - b.top }); }}
                  onPointerLeave={() => { setHover(null); setTip(null); }}
                  onFocus={() => setHover(s.key)}
                  onBlur={() => setHover(null)}
                  onClick={() => onSelect?.(selected === s.key ? null : s.key)}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onSelect?.(selected === s.key ? null : s.key))}
                />
              );
            })
          )}
        </svg>

        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-3xl font-bold leading-none">{shown ? shown.value : total}</span>
          <span className="mt-1 text-xs text-slate-500">{shown ? `${shown.label} (${pct(shown.value)}%)` : centerLabel}</span>
        </div>

        {tip && shown && (
          <div className="pointer-events-none absolute z-10 whitespace-nowrap rounded-lg border border-line bg-white px-3 py-1.5 text-xs shadow-lg" style={{ left: tip.x + 12, top: tip.y + 12 }}>
            <b className="text-sm text-ink">{shown.value}</b> <span className="text-slate-500">{shown.label}</span>
          </div>
        )}
      </div>

      <ul className="grid w-full gap-1.5">
        {slices.map((s) => (
          <li key={s.key}>
            <button
              onClick={() => onSelect?.(selected === s.key ? null : s.key)}
              onPointerEnter={() => setHover(s.key)}
              onPointerLeave={() => setHover(null)}
              aria-pressed={selected === s.key}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-1.5 text-sm hover:bg-slate-50 ${selected === s.key ? "bg-orange-50" : ""}`}
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} />
              <span className="flex-1 text-left text-slate-600">{s.label}</span>
              <b>{s.value}</b>
              <span className="w-10 text-right text-xs text-slate-400">{pct(s.value)}%</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
