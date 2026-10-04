"use client";

import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { MONTHS } from "@/lib/charts";

const iso = (y, m, d) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
const chip = { Scheduled: "bg-orange-50 text-brand hover:bg-orange-100", Completed: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100", Cancelled: "bg-slate-100 text-slate-500 line-through hover:bg-slate-200" };

// month grid of hearings: click a chip for details, click an empty day to schedule one
export default function HearingsCalendar({ month, onMonth, hearings, today, titleOf, onOpen, onAdd }) {
  const { y, m } = month;
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
            <div key={i} className={`group relative min-h-24 border-b border-r border-line p-1.5 ${d ? "bg-white" : "bg-slate-50/60"} ${i % 7 === 6 ? "border-r-0" : ""}`}>
              {d && (
                <>
                  <div className="flex items-center justify-between">
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${date === today ? "bg-brand font-semibold text-white" : "text-slate-600"}`}>{d}</span>
                    <button onClick={() => onAdd(date)} aria-label={`Add hearing on ${date}`} className="rounded p-0.5 text-slate-300 opacity-0 transition hover:bg-slate-100 hover:text-brand group-hover:opacity-100"><Plus size={14} /></button>
                  </div>
                  <ul className="mt-1 space-y-1">
                    {list.slice(0, 3).map((h) => (
                      <li key={h.id}>
                        <button onClick={() => onOpen(h)} title={`${h.time} - ${titleOf(h.caseNo)}`} className={`block w-full truncate rounded px-1.5 py-0.5 text-left text-[11px] font-medium ${chip[h.status]}`}>
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
    </div>
  );
}
