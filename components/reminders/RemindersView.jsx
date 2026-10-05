"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search, Calendar, Eye, Pencil, ArrowUpDown, Bell, AlarmClock, CalendarDays, CheckCircle2, FileText, UploadCloud, Users, FileCheck, Phone, CreditCard, File,
  Plus, Check, Undo2, Clock, FolderOpen, Trash2, X,
} from "lucide-react";
import Badge from "@/components/Badge";
import StatCard from "@/components/StatCard";
import FilterSelect from "@/components/FilterSelect";
import Pagination from "@/components/Pagination";
import RowMenu from "@/components/ui/RowMenu";
import { TodayPanel, MiniCalendar, SettingsPanel } from "./SidePanels";
import { useStore, daysFrom } from "@/lib/store";
import { useActions } from "@/components/ui/ActionsProvider";
import { useToast } from "@/components/ui/Toast";
import { caseSlug, formatDate } from "@/lib/cases";
import { relativeLabel } from "@/lib/hearings";
import { reminderTypes, priorities, typeStyles, priorityStyles, iconTile } from "@/lib/reminders";
import { loadSettings, saveSettings } from "@/lib/settings";

const icons = { doc: FileText, upload: UploadCloud, users: Users, check: FileCheck, phone: Phone, card: CreditCard, file: File };
const TABS = ["All Reminders", "Overdue", "Due Today", "This Week", "This Month", "Completed"];
const shiftIso = (iso, n) => new Date(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8)) + n * 86400000).toISOString().slice(0, 10);

export default function RemindersView() {
  const s = useStore();
  const act = useActions();
  const toast = useToast();
  const router = useRouter();
  const [tab, setTab] = useState("All Reminders");
  const [query, setQuery] = useState("");
  const [type, setType] = useState("All");
  const [priority, setPriority] = useState("All");
  const [caseTitle, setCaseTitle] = useState("All");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [day, setDay] = useState(null);
  const [dir, setDir] = useState("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState(new Set());
  const [month, setMonth] = useState(null);
  const [prefs, setPrefs] = useState({ email: true, inApp: true, before: "1 day before" });

  useEffect(() => { setPrefs(loadSettings().notifications); }, []);
  const savePrefs = (next) => {
    setPrefs(next);
    const all = loadSettings();
    saveSettings({ ...all, notifications: { ...all.notifications, email: next.email, inApp: next.inApp, before: next.before } });
  };

  const calMonth = month ?? { y: Number(s.today.slice(0, 4)), m: Number(s.today.slice(5, 7)) - 1 };
  const dow = (new Date(`${s.today}T00:00:00Z`).getUTCDay() + 6) % 7;
  const daysToFriday = dow <= 4 ? 4 - dow : 0; // "this week" ends on Friday

  const items = useMemo(
    () => s.reminders.map((r) => ({ ...r, days: daysFrom(s.today, r.date), caseTitle: r.caseNo ? s.caseTitle(r.caseNo) : "" })),
    [s.reminders, s.today, s.cases]
  );

  const matchTab = (t, r) => {
    if (t === "Completed") return r.completed;
    if (r.completed) return false;
    switch (t) {
      case "Overdue": return r.days < 0;
      case "Due Today": return r.days === 0;
      case "This Week": return r.days >= 0 && r.days <= daysToFriday;
      case "This Month": return r.days >= 0 && r.date.slice(0, 7) === s.today.slice(0, 7);
      default: return true;
    }
  };
  const counts = Object.fromEntries(TABS.map((t) => [t, items.filter((r) => matchTab(t, r)).length]));
  const marked = useMemo(() => new Set(items.filter((r) => !r.completed).map((r) => r.date)), [items]);
  const dueToday = items.filter((r) => matchTab("Due Today", r));
  const caseOptions = useMemo(() => [...new Set(items.map((r) => r.caseTitle).filter(Boolean))].sort(), [items]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items
      .filter((r) => {
        if (!matchTab(tab, r)) return false;
        if (type !== "All" && r.type !== type) return false;
        if (priority !== "All" && r.priority !== priority) return false;
        if (caseTitle !== "All" && r.caseTitle !== caseTitle) return false;
        if (day && r.date !== day) return false;
        if (from && r.date < from) return false;
        if (to && r.date > to) return false;
        if (q && ![r.title, r.note, r.caseTitle, r.caseNo].some((v) => String(v ?? "").toLowerCase().includes(q))) return false;
        return true;
      })
      .sort((a, b) => (a.date + a.id).localeCompare(b.date + b.id) * (dir === "asc" ? 1 : -1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, tab, type, priority, caseTitle, day, from, to, query, dir, s.today]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pages);
  const start = (current - 1) * pageSize;
  const visible = filtered.slice(start, start + pageSize);
  const allChecked = visible.length > 0 && visible.every((r) => selected.has(r.id));
  const chosen = [...selected].filter((id) => s.reminders.some((r) => r.id === id));

  const reset = (fn) => (v) => { fn(v); setPage(1); };
  const clear = () => { setQuery(""); setType("All"); setPriority("All"); setCaseTitle("All"); setFrom(""); setTo(""); setDay(null); setTab("All Reminders"); setPage(1); };
  const toggle = (id) => setSelected((x) => { const n = new Set(x); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelected((x) => { const n = new Set(x); visible.forEach((r) => (allChecked ? n.delete(r.id) : n.add(r.id))); return n; });
  const done = (r) => { s.completeReminders([r.id], !r.completed); toast(r.completed ? "Marked pending again" : "Reminder completed"); };

  const menu = (r) => [
    { label: r.completed ? "Mark as pending" : "Mark as done", icon: r.completed ? Undo2 : Check, onClick: () => done(r) },
    { label: "Snooze 1 day", icon: Clock, hidden: r.completed, onClick: () => { s.updateReminder(r.id, { date: shiftIso(r.date, 1) }); toast("Snoozed until tomorrow"); } },
    { label: "Edit reminder", icon: Pencil, onClick: () => act.editReminder(r) },
    { label: "Open case", icon: FolderOpen, hidden: !r.caseNo, onClick: () => router.push(`/cases/${caseSlug(r.caseNo)}`) },
    { label: "Delete", icon: Trash2, danger: true, divider: true, onClick: () => act.deleteReminders([r.id], () => setSelected((x) => { const n = new Set(x); n.delete(r.id); return n; })) },
  ];

  return (
    <div className="mx-auto flex max-w-350 flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl sm:h-13 sm:w-13 bg-red-600 text-white"><Bell size={26} /></div>
          <div className="min-w-0">
            <h1 className="text-3xl font-bold leading-tight">Reminders</h1>
            <p className="text-slate-600">Stay updated with important dates, tasks and deadlines.</p>
          </div>
        </div>
        <button onClick={() => act.addReminder()} className="flex items-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-dark"><Plus size={18} /> Add Reminder</button>
      </div>

      <div className="stagger grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4">
        <StatCard label="Total Reminders" value={counts["All Reminders"]} iconBg="bg-red-100 text-red-500" icon={<Bell size={30} strokeWidth={1.5} />} onClick={() => setTab("All Reminders")} />
        <StatCard label="Overdue" value={counts.Overdue} iconBg="bg-orange-100 text-orange-500" icon={<AlarmClock size={30} strokeWidth={1.5} />} onClick={() => setTab("Overdue")} />
        <StatCard label="Due This Week" value={counts["This Week"]} iconBg="bg-blue-100 text-blue-600" icon={<CalendarDays size={30} strokeWidth={1.5} />} onClick={() => setTab("This Week")} />
        <StatCard label="Completed" value={counts.Completed} iconBg="bg-emerald-100 text-emerald-600" icon={<CheckCircle2 size={30} strokeWidth={1.5} />} onClick={() => setTab("Completed")} />
      </div>

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[1fr_300px]">
        <div className="flex min-w-0 flex-col gap-5">
          <div className="flex flex-wrap gap-2">
            {TABS.map((t) => (
              <button key={t} onClick={() => { setTab(t); setPage(1); }} className={`flex items-center gap-2.5 rounded-lg border px-4 py-2.5 text-sm font-medium transition ${tab === t ? "border-brand bg-orange-50" : "border-transparent bg-white text-slate-700 hover:border-line"}`}>
                {t}
                <span className={`flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs ${tab === t ? "bg-brand text-white" : t === "Overdue" ? "bg-orange-100 text-orange-600" : t === "Due Today" ? "bg-red-100 text-red-600" : t === "Completed" ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-700"}`}>{counts[t]}</span>
              </button>
            ))}
          </div>

          <section className="rounded-xl border border-line bg-white shadow-sm">
            <form onSubmit={(e) => e.preventDefault()} className="flex flex-wrap items-end gap-3 p-4">
              <div className="relative min-w-52 flex-1">
                <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input value={query} onChange={(e) => reset(setQuery)(e.target.value)} placeholder="Search by case title, client, note..." className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none focus:border-brand focus:bg-white" />
              </div>
              <FilterSelect label="Type" value={type} onChange={reset(setType)} options={reminderTypes} />
              <FilterSelect label="Priority" value={priority} onChange={reset(setPriority)} options={priorities} />
              <FilterSelect label="Case" value={caseTitle} onChange={reset(setCaseTitle)} options={caseOptions} allLabel="All Cases" />
              <div className="w-full sm:w-auto">
                <span className="mb-1 block text-xs font-medium text-slate-600">Date Range</span>
                <div className="flex h-10 w-full items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm text-slate-600 sm:w-auto">
                  <Calendar size={15} />
                  <input type="date" value={from} onChange={(e) => reset(setFrom)(e.target.value)} aria-label="From date" className="min-w-0 flex-1 bg-transparent outline-none sm:w-31 sm:flex-none" />
                  <span>-</span>
                  <input type="date" value={to} onChange={(e) => reset(setTo)(e.target.value)} aria-label="To date" className="min-w-0 flex-1 bg-transparent outline-none sm:w-31 sm:flex-none" />
                </div>
              </div>
              <button type="button" onClick={clear} className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-medium hover:bg-slate-50">Clear Filters</button>
              <button type="submit" className="h-10 rounded-lg bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-dark">Search</button>
            </form>

            {day && <p className="anim-fade mx-4 mb-3 flex items-center gap-2 text-sm text-slate-600">Showing {formatDate(day)} <button onClick={() => setDay(null)} className="rounded-full p-0.5 hover:bg-slate-100" aria-label="Clear day"><X size={14} /></button></p>}

            {chosen.length > 0 && (
              <div className="anim-drop mx-4 mb-3 flex flex-wrap items-center gap-3 rounded-lg bg-orange-50 px-4 py-2.5 text-sm">
                <b>{chosen.length} selected</b>
                <button onClick={() => { s.completeReminders(chosen); setSelected(new Set()); toast(`${chosen.length} reminder(s) completed`); }} className="flex items-center gap-1.5 font-medium text-emerald-700"><Check size={14} /> Mark done</button>
                <button onClick={() => act.deleteReminders(chosen, () => setSelected(new Set()))} className="flex items-center gap-1.5 font-medium text-red-600"><Trash2 size={14} /> Delete</button>
                <button onClick={() => setSelected(new Set())} className="ml-auto text-slate-500 hover:text-ink">Clear</button>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full min-w-225 text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-700">
                    <th className="w-10 px-4 py-3"><input type="checkbox" checked={allChecked} onChange={toggleAll} className="h-4 w-4 accent-brand" aria-label="Select all" /></th>
                    <th className="px-3 py-3 font-medium">Reminder Title</th>
                    <th className="px-3 py-3 font-medium">Related Case</th>
                    <th className="px-3 py-3 font-medium">Type</th>
                    <th className="px-3 py-3"><button onClick={() => setDir(dir === "asc" ? "desc" : "asc")} className="flex items-center gap-1.5 font-medium">Date &amp; Time <ArrowUpDown size={13} className="text-slate-500" /></button></th>
                    <th className="px-3 py-3 font-medium">Priority</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-3 py-3 text-center font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {visible.length === 0 && <tr><td colSpan={8} className="py-16 text-center text-slate-500">No reminders match your filters.</td></tr>}
                  {visible.map((r) => {
                    const Icon = icons[r.icon] ?? File;
                    const rel = relativeLabel(r.days);
                    const overdue = !r.completed && r.days < 0;
                    return (
                      <tr key={r.id} className={`hover:bg-slate-50/60 ${r.completed ? "opacity-70" : ""}`}>
                        <td className="px-4 py-3"><input type="checkbox" checked={selected.has(r.id)} onChange={() => toggle(r.id)} className="h-4 w-4 accent-brand" aria-label={`Select ${r.title}`} /></td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-3">
                            <button onClick={() => done(r)} title={r.completed ? "Mark as pending" : "Mark as done"} aria-label={r.completed ? "Mark as pending" : "Mark as done"} className={`group flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${r.completed ? "bg-emerald-50 text-emerald-600" : iconTile[r.icon]}`}>
                              {r.completed ? <Check size={19} /> : <><Icon size={19} strokeWidth={1.75} className="group-hover:hidden" /><Check size={19} className="hidden group-hover:block" /></>}
                            </button>
                            <div className="min-w-0 leading-snug">
                              <p className={`font-semibold ${r.completed ? "line-through" : ""}`}>{r.title}</p>
                              <p className="max-w-52 truncate text-xs text-slate-500">{r.note}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          {r.caseNo ? (<><Link href={`/cases/${caseSlug(r.caseNo)}`} className="font-medium hover:text-brand">{r.caseTitle}</Link><p className="text-xs text-slate-500">{r.caseNo}</p></>) : <span className="text-slate-400">-</span>}
                        </td>
                        <td className="px-3 py-3"><Badge className={typeStyles[r.type]}>{r.type}</Badge></td>
                        <td className="px-3 py-3">
                          <p className={`text-xs font-medium ${!r.completed && r.days <= 0 ? "text-red-600" : "text-slate-700"}`}>{formatDate(r.date)}, {r.time}</p>
                          {!r.completed && <span className={`mt-1 inline-block rounded px-2 py-0.5 text-[11px] ${rel.tone}`}>{rel.text}</span>}
                        </td>
                        <td className="px-3 py-3"><Badge className={priorityStyles[r.priority]}>{r.priority}</Badge></td>
                        <td className="px-3 py-3"><Badge className={r.completed ? "bg-green-50 text-green-600" : overdue ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700"}>{r.completed ? "Completed" : overdue ? "Overdue" : "Pending"}</Badge></td>
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-center gap-1.5">
                            {r.caseNo
                              ? <Link href={`/cases/${caseSlug(r.caseNo)}`} aria-label="View case" className="rounded-md bg-slate-100 p-2 text-slate-700 hover:bg-slate-200"><Eye size={16} /></Link>
                              : <button onClick={() => act.editReminder(r)} aria-label="View reminder" className="rounded-md bg-slate-100 p-2 text-slate-700 hover:bg-slate-200"><Eye size={16} /></button>}
                            <button onClick={() => act.editReminder(r)} aria-label="Edit" className="rounded-md bg-slate-100 p-2 text-slate-700 hover:bg-slate-200"><Pencil size={16} /></button>
                            <RowMenu items={menu(r)} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Pagination total={filtered.length} page={current} pageSize={pageSize} onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(1); }} unit="reminders" />
          </section>
        </div>

        <aside className="stagger flex flex-col gap-5">
          <TodayPanel items={dueToday} onComplete={(r) => { s.completeReminders([r.id]); toast("Reminder completed"); }} />
          <MiniCalendar month={calMonth} todayIso={s.today} marked={marked} selected={day} onSelect={(d) => { setDay(d); setPage(1); }} onMonth={setMonth} />
          <SettingsPanel settings={prefs} onChange={savePrefs} />
        </aside>
      </div>
    </div>
  );
}
