"use client";

import { SERIES, INK } from "@/lib/charts";

// rows: [{ key, label, value }]  - one series, so one colour; click a bar to select it
export default function HBars({ rows, selected, onSelect, color = SERIES[0], unit = "", total }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  const sum = total ?? rows.reduce((a, r) => a + r.value, 0);

  return (
    <ul className="flex flex-col gap-3.5">
      {rows.map((r, i) => {
        const dim = selected && selected !== r.key;
        return (
          <li key={r.key}>
            <button
              onClick={() => onSelect?.(selected === r.key ? null : r.key)}
              aria-pressed={selected === r.key}
              aria-label={`${r.label}: ${r.value}${unit}`}
              className="group relative grid w-full grid-cols-[88px_1fr] items-center gap-3 text-left outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-sky-300"
            >
              <span className="truncate text-sm" style={{ color: INK.secondary }}>{r.label}</span>
              <span className="flex items-center gap-2.5">
                <span className="relative h-5 flex-1">
                  <span
                    className="chart-bar absolute inset-y-0 left-0 block rounded-r-[4px] transition-[opacity,filter,width] duration-300 group-hover:brightness-110"
                    style={{ width: `${(r.value / max) * 100}%`, background: color, opacity: dim ? 0.35 : 1, animationDelay: `${i * 0.08}s` }}
                  />
                </span>
                <b className="w-7 text-right text-sm tabular-nums">{r.value}</b>
              </span>
              <span className="pointer-events-none absolute -top-9 left-24 z-10 hidden whitespace-nowrap rounded-lg border border-line bg-white px-3 py-1.5 text-xs shadow-lg group-hover:block group-focus-visible:block">
                <b className="text-sm text-ink">{r.value}</b> <span className="text-slate-500">{r.label}{sum ? ` - ${Math.round((r.value / sum) * 100)}% of total` : ""}</span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
