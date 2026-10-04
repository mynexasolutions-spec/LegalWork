"use client";

import { useEffect, useRef, useState } from "react";
import { INK, niceStep } from "@/lib/charts";

const M = { l: 34, r: 16, t: 14, b: 30 };

export function Legend({ items }) {
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-600">
      {items.map((i) => (
        <li key={i.key} className="flex items-center gap-2">
          <span className="h-0.5 w-4 rounded" style={{ background: i.color }} /> {i.label}
        </li>
      ))}
    </ul>
  );
}

// data: [{ label, values: { [seriesKey]: number } }]   series: [{ key, label, color }]
export default function LineChart({ data, series, markIndex = null, markLabel = "Today", height = 250, ariaLabel }) {
  const wrap = useRef(null);
  const [w, setW] = useState(640);
  const [idx, setIdx] = useState(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.floor(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const n = data.length;
  const maxV = Math.max(1, ...data.flatMap((d) => series.map((s) => d.values[s.key] || 0)));
  const step = niceStep(maxV);
  const top = Math.ceil(maxV / step) * step;
  const iw = w - M.l - M.r;
  const ih = height - M.t - M.b;
  const x = (i) => M.l + (n === 1 ? iw / 2 : (i * iw) / (n - 1));
  const y = (v) => M.t + ih - (v / top) * ih;
  const ticks = [];
  for (let v = 0; v <= top; v += step) ticks.push(v);
  const line = (key) => data.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(d.values[key] || 0).toFixed(1)}`).join(" ");
  const area = (key) => `${line(key)} L${x(n - 1).toFixed(1)} ${y(0)} L${x(0).toFixed(1)} ${y(0)} Z`;
  const every = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(iw / 64))));

  const locate = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const i = Math.round(((e.clientX - r.left - M.l) / iw) * (n - 1));
    setIdx(Math.max(0, Math.min(n - 1, i)));
  };
  const onKey = (e) => {
    if (e.key === "ArrowRight") { e.preventDefault(); setIdx((i) => Math.min(n - 1, (i ?? (markIndex ?? 0) - 1) + 1)); }
    if (e.key === "ArrowLeft") { e.preventDefault(); setIdx((i) => Math.max(0, (i ?? (markIndex ?? 0) + 1) - 1)); }
    if (e.key === "Escape") setIdx(null);
  };

  const flip = idx !== null && x(idx) > w * 0.62;

  return (
    <div ref={wrap} className="relative w-full select-none">
      <svg width={w} height={height} role="img" aria-label={ariaLabel} tabIndex={0} onKeyDown={onKey} onBlur={() => setIdx(null)} className="block overflow-visible outline-none focus-visible:rounded focus-visible:ring-2 focus-visible:ring-sky-300">
        {ticks.map((v) => (
          <g key={v}>
            <line x1={M.l} x2={w - M.r} y1={y(v)} y2={y(v)} stroke={v === 0 ? INK.axis : INK.grid} strokeWidth="1" />
            <text x={M.l - 8} y={y(v) + 4} textAnchor="end" fontSize="11" fill={INK.muted}>{v.toLocaleString("en-IN")}</text>
          </g>
        ))}
        {data.map((d, i) => i % every === 0 && (
          <text key={d.label + i} x={x(i)} y={height - 8} textAnchor="middle" fontSize="11" fill={INK.muted}>{d.label}</text>
        ))}

        {markIndex !== null && (
          <g>
            <line x1={x(markIndex)} x2={x(markIndex)} y1={M.t} y2={y(0)} stroke={INK.axis} strokeWidth="1" />
            <text x={x(markIndex) + 5} y={M.t + 9} fontSize="10" fill={INK.secondary}>{markLabel}</text>
          </g>
        )}

        <path className="chart-area" d={area(series[0].key)} fill={series[0].color} fillOpacity="0.1" />
        {series.map((s) => (
          <path key={s.key} className="chart-draw" pathLength="1" d={line(s.key)} fill="none" stroke={s.color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        ))}

        {idx !== null && (
          <g pointerEvents="none">
            <line x1={x(idx)} x2={x(idx)} y1={M.t} y2={y(0)} stroke={INK.secondary} strokeWidth="1" />
            {series.map((s) => (
              <circle key={s.key} cx={x(idx)} cy={y(data[idx].values[s.key] || 0)} r="4.5" fill={s.color} stroke={INK.surface} strokeWidth="2" />
            ))}
          </g>
        )}

        <rect x={M.l} y={M.t - 6} width={iw} height={ih + 12} fill="transparent" onPointerMove={locate} onPointerDown={locate} onPointerLeave={() => setIdx(null)} />
      </svg>

      {idx !== null && (
        <div
          className="pointer-events-none absolute top-1 z-10 min-w-36 rounded-lg border border-line bg-white px-3 py-2 text-xs shadow-lg"
          style={{ left: x(idx), transform: `translateX(${flip ? "calc(-100% - 12px)" : "12px"})` }}
        >
          <p className="mb-1.5 font-medium text-slate-500">Week of {data[idx].label}</p>
          {series.map((s) => (
            <p key={s.key} className="flex items-center gap-2">
              <span className="h-0.5 w-3 rounded" style={{ background: s.color }} />
              <b className="text-sm text-ink">{data[idx].values[s.key] || 0}</b>
              <span className="text-slate-500">{s.label}</span>
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
