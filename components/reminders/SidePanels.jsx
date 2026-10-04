"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, Bell, Smartphone, Clock, Settings, Check } from "lucide-react";
import { typeDot } from "@/lib/reminders";
import { caseSlug } from "@/lib/cases";

const panel = "rounded-xl border border-line bg-white p-5 shadow-sm";
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const iso = (y, m, d) => `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

export function TodayPanel({ items, onComplete }) {
  return (
    <section className={panel}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-bold">Today&apos;s Reminders</h2>
        <span className="text-xs text-slate-500">{items.length} due</span>
      </div>
      {items.length === 0 ? (
        <p className="py-4 text-center text-sm text-slate-500">Nothing due today.</p>
      ) : (
        <ul className="space-y-4">
          {items.map((r) => (
            <li key={r.id} className="grid grid-cols-[10px_72px_1fr] items-start gap-3 text-sm">
              <span className={`mt-1.5 h-2.5 w-2.5 rounded-full ${typeDot[r.type]}`} />
              <span className="text-slate-500">{r.time}</span>
              <div className="group flex items-start justify-between gap-2 leading-snug">
                <div className="min-w-0">
                  <p className="font-semibold">{r.title}</p>
                  {r.caseNo ? <Link href={`/cases/${caseSlug(r.caseNo)}`} className="text-slate-500 hover:text-brand">{r.caseTitle}</Link> : <span className="text-slate-500">{r.note}</span>}
                </div>
                <button onClick={() => onComplete(r)} aria-label={`Complete ${r.title}`} title="Mark as done" className="rounded-md p-1 text-slate-300 hover:bg-emerald-50 hover:text-emerald-600 group-hover:text-slate-400"><Check size={15} /></button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function MiniCalendar({ month, todayIso, marked, selected, onSelect, onMonth }) {
  const { y, m } = month;
  const first = new Date(Date.UTC(y, m, 1)).getUTCDay();
  const inMonth = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const prevDays = new Date(Date.UTC(y, m, 0)).getUTCDate();
  const cells = [];
  for (let i = first - 1; i >= 0; i--) cells.push({ d: prevDays - i, faded: true });
  for (let d = 1; d <= inMonth; d++) cells.push({ d, date: iso(y, m, d) });
  for (let d = 1; cells.length % 7; d++) cells.push({ d, faded: true });

  const shift = (n) => {
    const t = new Date(Date.UTC(y, m + n, 1));
    onMonth({ y: t.getUTCFullYear(), m: t.getUTCMonth() });
  };

  return (
    <section className={panel}>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-bold">{MONTHS[m]} {y}</h2>
        <div className="flex gap-2">
          <button onClick={() => shift(-1)} aria-label="Previous month" className="flex h-8 w-8 items-center justify-center rounded-md border border-line hover:bg-slate-50"><ChevronLeft size={15} /></button>
          <button onClick={() => shift(1)} aria-label="Next month" className="flex h-8 w-8 items-center justify-center rounded-md border border-line hover:bg-slate-50"><ChevronRight size={15} /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-y-1 text-center text-xs">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => (
          <span key={d} className="py-1.5 font-medium text-slate-500">{d}</span>
        ))}
        {cells.map((c, i) =>
          c.faded ? (
            <span key={i} className="py-2 text-slate-300">{c.d}</span>
          ) : (
            <button
              key={i}
              onClick={() => onSelect(selected === c.date ? null : c.date)}
              className={`relative mx-auto flex h-8 w-8 items-center justify-center rounded-md text-sm ${
                c.date === todayIso
                  ? "bg-brand font-semibold text-white"
                  : c.date === selected
                    ? "bg-orange-100 font-semibold"
                    : "hover:bg-slate-100"
              }`}
            >
              {c.d}
              {marked.has(c.date) && (
                <span className={`absolute bottom-0.5 h-1 w-1 rounded-full ${c.date === todayIso ? "bg-white" : "bg-red-500"}`} />
              )}
            </button>
          )
        )}
      </div>
    </section>
  );
}

function Toggle({ on, onChange, label }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? "bg-brand" : "bg-slate-300"}`}
    >
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${on ? "left-5.5" : "left-0.5"}`} />
    </button>
  );
}

export function SettingsPanel({ settings, onChange }) {
  return (
    <section className={panel}>
      <h2 className="mb-4 flex items-center gap-2 font-bold"><Settings size={18} /> Reminder Settings</h2>
      <div className="space-y-4 text-sm">
        <div className="flex items-center gap-3">
          <Bell size={20} className="text-slate-600" />
          <div className="flex-1 leading-snug">
            <p className="font-medium">Email Notifications</p>
            <p className="text-xs text-slate-500">Receive reminders via email</p>
          </div>
          <Toggle label="Email notifications" on={settings.email} onChange={(v) => onChange({ ...settings, email: v })} />
        </div>
        <div className="flex items-center gap-3">
          <Smartphone size={20} className="text-slate-600" />
          <div className="flex-1 leading-snug">
            <p className="font-medium">In-App Notifications</p>
            <p className="text-xs text-slate-500">Get notified in the application</p>
          </div>
          <Toggle label="In-app notifications" on={settings.inApp} onChange={(v) => onChange({ ...settings, inApp: v })} />
        </div>
        <div className="flex items-start gap-3">
          <Clock size={20} className="mt-0.5 text-slate-600" />
          <div className="flex-1 leading-snug">
            <p className="font-medium">Reminder Time</p>
            <p className="text-xs text-slate-500">Default reminder time before event</p>
            <select
              value={settings.before}
              onChange={(e) => onChange({ ...settings, before: e.target.value })}
              className="mt-3 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-brand"
            >
              {["1 hour before", "3 hours before", "1 day before", "2 days before", "1 week before"].map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </section>
  );
}
