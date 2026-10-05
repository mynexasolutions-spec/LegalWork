"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { MONTHS } from "@/lib/charts";
import { formatDate } from "@/lib/cases";

const iso = (y, m, d) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
const dot = { Scheduled: "bg-brand", Completed: "bg-emerald-500", Cancelled: "bg-slate-300" };
const chip = { Scheduled: "bg-orange-50 text-brand hover:bg-orange-100", Completed: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100", Cancelled: "bg-slate-100 text-slate-500 line-through hover:bg-slate-200" };

// month grid of hearings: click a chip for details, click an empty day to schedule one
export default function HearingsCalendar({ month, onMonth, hearings, today, titleOf, onOpen, onAdd }) {
  const { y, m } = month;
  const [picked, setPicked] = useState(null);
  const lead = new Date(Date.UTC(y, m, 1)).getUTCDay();
  const days = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const cells = [...Array(lead).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  while (cells.length % 7) cells.push(null);

  const shift = (n) => {
    const t = new Date(Date.UTC(y, m + n, 1));
    onMonth({ y: t.getUTCFullYear(), m: t.getUTCMonth() });
  };
  const byDate = {};
  hearings.forEach((h) => (byDate[h.date] ??= []).push(h));
  const sel = picked ?? (today.slice(0, 7) === `${y}-${String(m + 1).padStart(2, "0")}` ? today : iso(y, m, 1));
  const selList = byDate[sel] ?? [];

  return (
    <div className="anim-fade p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-lg font-bold">{MONTHS[m]} {y}</h3>
        <div className="flex gap-2">
          <button onClick={() => onMonth({ y: Number(today.slice(0, 4)), m: Number(today.slice(5, 7)) - 1 })} className="rounded-lg border border-line px-4 py-2 text-sm font-medium hover:bg-slate-50">Today</button>
          <button onClick={() => shift(-1)} aria-label="Previous month" className="flex h-9 w-9 items-center justify-center rounded-lg border border-line hover:bg-slate-50"><ChevronLeft size={16} /></button>
          <button onClick={() => shift(1)} aria-label="Next month" className="flex h-9 w-9 items-center justify-center rounded-lg border border-line hover:bg-slate-50"><ChevronRight size={16} /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 overflow-hidden rounded-lg border border-line text-sm">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="border-b border-line bg-slate-50 px-2 py-2 text-center text-xs font-medium text-slate-500">{d}</div>
        ))}
        {cells.map((d, i) => {
          const date = d ? iso(y, m, d) : null;
          const list = date ? byDate[date] ?? [] : [];
          return (
            <div key={i} onClick={() => d && setPicked(date)} className={`group relative min-h-14 border-b border-r border-line p-1 sm:min-h-24 sm:p-1.5 ${d ? "cursor-pointer bg-white sm:cursor-default" : "bg-slate-50/60"} ${date === sel ? "max-sm:bg-orange-50" : ""} ${i % 7 === 6 ? "border-r-0" : ""}`}>
              {d && (
                <>
                  <div className="flex items-center justify-between">
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${date === today ? "bg-brand font-semibold text-white" : "text-slate-600"}`}>{d}</span>
                    <button onClick={(e) => { e.stopPropagation(); onAdd(date); }} aria-label={`Add hearing on ${date}`} className="hidden rounded p-0.5 sm:block text-slate-300 opacity-0 transition hover:bg-slate-100 hover:text-brand group-hover:opacity-100"><Plus size={14} /></button>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-0.5 sm:hidden">
                    {list.slice(0, 3).map((h) => <span key={h.id} className={`h-1.5 w-1.5 rounded-full ${dot[h.status]}`} />)}
                    {list.length > 3 && <span className="text-[9px] leading-none text-slate-500">+{list.length - 3}</span>}
                  </div>
                  <ul className="mt-1 hidden space-y-1 sm:block">
                    {list.slice(0, 3).map((h) => (
                      <li key={h.id}>
                        <button onClick={(e) => { e.stopPropagation(); onOpen(h); }} title={`${h.time} - ${titleOf(h.caseNo)}`} className={`block w-full truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium ${chip[h.status]}`}>
                          {h.time.replace(" ", "").toLowerCase()} {titleOf(h.caseNo)}
                        </button>
                      </li>
                    ))}
                    {list.length > 3 && <li className="px-1.5 text-[11px] text-slate-500">+{list.length - 3} more</li>}
                  </ul>
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 sm:hidden">
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-sm font-bold">{formatDate(sel)}</h4>
          <button onClick={() => onAdd(sel)} className="flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-xs font-semibold text-white"><Plus size={13} /> Add hearing</button>
        </div>
        {selList.length === 0 ? (
          <p className="rounded-lg bg-slate-50 py-6 text-center text-sm text-slate-500">No hearings on this day.</p>
        ) : (
          <ul className="space-y-2">
            {selList.map((h) => (
              <li key={h.id}>
                <button onClick={() => onOpen(h)} className="flex w-full items-center gap-3 rounded-lg border border-line p-3 text-left">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${dot[h.status]}`} />
                  <span className="min-w-0 flex-1 text-sm leading-snug"><span className="block truncate font-semibold">{titleOf(h.caseNo)}</span><span className="block text-xs text-slate-500">{h.time} - {h.purpose}</span></span>
                  <span className="text-xs text-slate-400">{h.status}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
