"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search, Calendar, Eye, Pencil, ArrowUpDown, ChevronLeft, ChevronRight, CalendarClock, CalendarDays, Clock, Flame, Plus, Download, List, Check, Bell, Trash2, FolderOpen,
} from "lucide-react";
import Badge from "@/components/Badge";
import StatCard from "@/components/StatCard";
import FilterSelect from "@/components/FilterSelect";
import Pagination from "@/components/Pagination";
import RowMenu from "@/components/ui/RowMenu";
import HearingsCalendar from "./HearingsCalendar";
import { useStore, daysFrom } from "@/lib/store";
import { useActions } from "@/components/ui/ActionsProvider";
import { useToast } from "@/components/ui/Toast";
import { caseTypeStyles } from "@/lib/data";
import { caseTypes, formatDate } from "@/lib/cases";
import { relativeLabel } from "@/lib/hearings";
import { downloadBlob, toCsv } from "@/lib/format";

const TABS = ["All Hearings", "This Week", "This Month", "Overdue", "Completed"];
const statusTone = { Upcoming: "bg-amber-100 text-amber-700", Overdue: "bg-red-100 text-red-600", Completed: "bg-emerald-50 text-emerald-600", Cancelled: "bg-slate-100 text-slate-500" };
const shiftIso = (iso, n) => new Date(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8)) + n * 86400000).toISOString().slice(0, 10);

export default function HearingsView() {
  const s = useStore();
  const act = useActions();
  const toast = useToast();
  const router = useRouter();
  const [mode, setMode] = useState("list");
  const [tab, setTab] = useState("All Hearings");
  const [query, setQuery] = useState("");
  const [type, setType] = useState("All");
  const [court, setCourt] = useState("All");
  const [status, setStatus] = useState("All");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [dir, setDir] = useState("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [offset, setOffset] = useState(0);
  const [month, setMonth] = useState(null);

  const ref = shiftIso(s.today, offset); // the arrows move this reference date a week at a time
  const calMonth = month ?? { y: Number(s.today.slice(0, 4)), m: Number(s.today.slice(5, 7)) - 1 };

  const rows = useMemo(
    () =>
      s.hearings.map((h) => {
        const c = s.cases.find((x) => x.caseNo === h.caseNo);
        const days = daysFrom(ref, h.date);
        const state = h.status === "Scheduled" ? (days < 0 ? "Overdue" : "Upcoming") : h.status;
        return { ...h, c, days, state, title: c?.title ?? h.caseNo, client: c?.client ?? "-", type: c?.type ?? "-" };
      }),
    [s.hearings, s.cases, ref]
  );

  const matchTab = (t, h) => {
    switch (t) {
      case "All Hearings": return h.state === "Upcoming";
      case "This Week": return h.state === "Upcoming" && h.days <= 6;
      case "This Month": return h.state === "Upcoming" && h.date.slice(0, 7) === ref.slice(0, 7);
      case "Overdue": return h.state === "Overdue";
      case "Completed": return h.state === "Completed";
      default: return true;
    }
  };
  const counts = Object.fromEntries(TABS.map((t) => [t, rows.filter((h) => matchTab(t, h)).length]));
  const courts = useMemo(() => [...new Set(s.hearings.map((h) => h.court).filter(Boolean))].sort(), [s.hearings]);
  const upcoming = rows.filter((h) => h.state === "Upcoming").sort((a, b) => a.date.localeCompare(b.date));
  const next = upcoming[0];

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows
      .filter((h) => {
        if (!matchTab(tab, h)) return false;
        if (type !== "All" && h.type !== type) return false;
        if (court !== "All" && h.court !== court) return false;
        if (status !== "All" && h.state !== status) return false;
        if (from && h.date < from) return false;
        if (to && h.date > to) return false;
        if (q && ![h.title, h.caseNo, h.client, h.court, h.purpose].some((v) => String(v).toLowerCase().includes(q))) return false;
        return true;
      })
      .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time) * (dir === "asc" ? 1 : -1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, tab, type, court, status, from, to, query, dir]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pages);
  const start = (current - 1) * pageSize;
  const visible = filtered.slice(start, start + pageSize);

  const reset = (fn) => (v) => { fn(v); setPage(1); };
  const clear = () => { setQuery(""); setType("All"); setCourt("All"); setStatus("All"); setFrom(""); setTo(""); setTab("All Hearings"); setPage(1); };

  const exportCsv = () => {
    const csv = toCsv(["Date", "Time", "Case", "Case No.", "Client", "Type", "Court", "Purpose", "Status"], filtered.map((h) => [formatDate(h.date), h.time, h.title, h.caseNo, h.client, h.type, h.court, h.purpose, h.state]));
    downloadBlob(new Blob([csv], { type: "text/csv" }), "hearings.csv");
    toast(`Exported ${filtered.length} hearings`);
  };

  const menu = (h) => [
    { label: "View details", icon: Eye, onClick: () => act.viewHearing(h) },
    { label: "Mark completed", icon: Check, hidden: h.status !== "Scheduled", onClick: () => act.completeHearing(h) },
    { label: "Add reminder", icon: Bell, hidden: h.status !== "Scheduled", onClick: () => act.addReminder({ title: `Hearing: ${h.purpose}`, caseNo: h.caseNo, date: h.date, type: "Hearing", priority: "High" }) },
    { label: "Open case", icon: FolderOpen, onClick: () => router.push(`/cases/${h.c?.id}`) },
    { label: "Delete hearing", icon: Trash2, danger: true, divider: true, onClick: () => act.deleteHearing(h) },
  ];

  return (
    <div className="mx-auto flex max-w-350 flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-13 w-13 items-center justify-center rounded-xl bg-red-600 text-white"><CalendarClock size={26} /></div>
          <div>
            <h1 className="text-3xl font-bold leading-tight">Upcoming Hearings</h1>
            <p className="text-slate-600">All scheduled hearings for your cases.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setMode(mode === "list" ? "calendar" : "list")} className="flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-medium hover:bg-slate-50">
            {mode === "list" ? <><CalendarDays size={16} /> Calendar View</> : <><List size={16} /> List View</>}
          </button>
          <button onClick={exportCsv} className="flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-medium hover:bg-slate-50"><Download size={16} /> Export</button>
          <button onClick={() => act.addHearing()} className="flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-dark"><Plus size={18} /> Add Hearing</button>
        </div>
      </div>

      <div className="stagger grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4">
        <StatCard label="Total Upcoming Hearings" value={counts["All Hearings"]} iconBg="bg-red-100 text-red-600" icon={<CalendarClock size={30} strokeWidth={1.5} />} onClick={() => { setTab("All Hearings"); setMode("list"); }} />
        <div className="lift flex items-center gap-4 rounded-xl border border-line bg-white p-5 shadow-sm">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600"><Flame size={30} strokeWidth={1.5} /></div>
          <div className="min-w-0">
            <p className="text-sm text-slate-600">Next Hearing</p>
            {next ? (
              <>
                <p className="text-xl font-bold leading-tight">{formatDate(next.date)}</p>
                <Link href={`/cases/${next.c?.id}`} className="block truncate text-sm text-slate-500 hover:text-brand">{next.title}</Link>
              </>
            ) : <p className="text-sm text-slate-500">Nothing scheduled</p>}
          </div>
        </div>
        <StatCard label="This Week" value={counts["This Week"]} iconBg="bg-amber-100 text-amber-500" icon={<Clock size={30} strokeWidth={1.5} />} onClick={() => { setTab("This Week"); setMode("list"); }} />
        <StatCard label="This Month" value={counts["This Month"]} iconBg="bg-blue-100 text-blue-600" icon={<CalendarDays size={30} strokeWidth={1.5} />} onClick={() => { setTab("This Month"); setMode("list"); }} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button key={t} onClick={() => { setTab(t); setPage(1); setMode("list"); }} className={`flex items-center gap-2.5 rounded-lg border px-5 py-2.5 text-sm font-medium transition ${tab === t && mode === "list" ? "border-brand bg-orange-50" : "border-transparent bg-white text-slate-700 hover:border-line"}`}>
              {t}
              <span className={`flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs ${tab === t && mode === "list" ? "bg-brand text-white" : t === "Overdue" && counts[t] ? "bg-red-100 text-red-600" : "bg-slate-100 text-slate-700"}`}>{counts[t]}</span>
            </button>
          ))}
        </div>
        {mode === "list" && (
          <div className="flex items-center gap-2" title="Moves the reference date for This Week, Overdue and the 'In N days' labels">
            <button onClick={() => setOffset(0)} className="rounded-lg border border-line bg-white px-5 py-2.5 text-sm font-medium hover:bg-slate-50">{offset ? "Back to today" : "Today"}</button>
            <button onClick={() => setOffset(offset - 7)} aria-label="Previous week" className="flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-white hover:bg-slate-50"><ChevronLeft size={16} /></button>
            <button onClick={() => setOffset(offset + 7)} aria-label="Next week" className="flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-white hover:bg-slate-50"><ChevronRight size={16} /></button>
          </div>
        )}
      </div>

      <section className="rounded-xl border border-line bg-white shadow-sm">
        {mode === "calendar" ? (
          <HearingsCalendar
            month={calMonth}
            onMonth={setMonth}
            hearings={rows.filter((h) => h.status !== "Cancelled")}
            today={s.today}
            titleOf={(n) => s.caseTitle(n)}
            onOpen={(h) => act.viewHearing(h)}
            onAdd={(date) => act.addHearing({ date })}
          />
        ) : (
          <>
            <form onSubmit={(e) => e.preventDefault()} className="flex flex-wrap items-end gap-4 p-4">
              <div className="relative min-w-60 flex-1">
                <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input value={query} onChange={(e) => reset(setQuery)(e.target.value)} placeholder="Search by case title, case number, client..." className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none focus:border-brand focus:bg-white" />
              </div>
              <FilterSelect label="Case Type" value={type} onChange={reset(setType)} options={caseTypes} />
              <FilterSelect label="Court" value={court} onChange={reset(setCourt)} options={courts} />
              <div>
                <span className="mb-1 block text-xs font-medium text-slate-600">Date Range</span>
                <div className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm text-slate-600">
                  <Calendar size={15} />
                  <input type="date" value={from} onChange={(e) => reset(setFrom)(e.target.value)} aria-label="From date" className="w-31 bg-transparent outline-none" />
                  <span>-</span>
                  <input type="date" value={to} onChange={(e) => reset(setTo)(e.target.value)} aria-label="To date" className="w-31 bg-transparent outline-none" />
                </div>
              </div>
              <FilterSelect label="Status" value={status} onChange={reset(setStatus)} options={["Upcoming", "Overdue", "Completed", "Cancelled"]} />
              <button type="button" onClick={clear} className="h-10 rounded-lg border border-slate-200 px-5 text-sm font-medium hover:bg-slate-50">Clear Filters</button>
              <button type="submit" className="h-10 rounded-lg bg-brand px-6 text-sm font-semibold text-white hover:bg-brand-dark">Search</button>
            </form>

            <div className="overflow-x-auto">
              <table className="w-full min-w-250 text-left text-sm">
                <thead>
                  <tr className="bg-slate-50 text-slate-700">
                    <th className="w-12 px-4 py-3 font-medium">#</th>
                    <th className="px-3 py-3"><button onClick={() => setDir(dir === "asc" ? "desc" : "asc")} className="flex items-center gap-1.5 font-medium">Date &amp; Time <ArrowUpDown size={13} className="text-slate-500" /></button></th>
                    <th className="px-3 py-3 font-medium">Case Title <span className="block text-xs font-normal text-slate-500">Case No.</span></th>
                    <th className="px-3 py-3 font-medium">Client</th>
                    <th className="px-3 py-3 font-medium">Type</th>
                    <th className="px-3 py-3 font-medium">Court</th>
                    <th className="px-3 py-3 font-medium">Purpose</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-3 py-3 text-center font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {visible.length === 0 && <tr><td colSpan={9} className="py-16 text-center text-slate-500">No hearings match your filters.</td></tr>}
                  {visible.map((h, i) => {
                    const rel = relativeLabel(h.days);
                    const live = h.status === "Scheduled";
                    return (
                      <tr key={h.id} className={h.days === 0 && live ? "bg-red-50/60" : "hover:bg-slate-50/60"}>
                        <td className="px-4 py-3">{start + i + 1}</td>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-3">
                            <div className={`text-xs leading-tight ${live ? (h.days <= 0 ? "text-red-600" : "text-emerald-700") : "text-slate-500"}`}>
                              <p className="text-sm font-medium">{formatDate(h.date)}</p>
                              <p className="opacity-80">{h.time}</p>
                            </div>
                            {live && <span className={`rounded-md px-2.5 py-1 text-xs ${rel.tone}`}>{rel.text}</span>}
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          {h.c ? <Link href={`/cases/${h.c.id}`} className="font-semibold hover:text-brand">{h.title}</Link> : <span className="font-semibold">{h.title}</span>}
                          <p className="text-xs text-slate-500">{h.caseNo}</p>
                        </td>
                        <td className="px-3 py-3 text-slate-500">{h.client}</td>
                        <td className="px-3 py-3">{h.c && <Badge className={caseTypeStyles[h.type]}>{h.type}</Badge>}</td>
                        <td className="px-3 py-3 text-slate-600">{h.court}</td>
                        <td className="px-3 py-3 text-slate-600">{h.purpose}</td>
                        <td className="px-3 py-3"><Badge className={statusTone[h.state]}>{h.state}</Badge></td>
                        <td className="px-3 py-3">
                          <div className="flex items-center justify-center gap-1.5">
                            <button onClick={() => act.viewHearing(h)} aria-label="View hearing" className="rounded-md bg-slate-100 p-2 text-slate-700 hover:bg-slate-200"><Eye size={16} /></button>
                            <button onClick={() => act.editHearing(h)} aria-label="Edit hearing" className="rounded-md bg-slate-100 p-2 text-slate-700 hover:bg-slate-200"><Pencil size={16} /></button>
                            <RowMenu items={menu(h)} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Pagination total={filtered.length} page={current} pageSize={pageSize} onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(1); }} unit="hearings" />
          </>
        )}
      </section>
    </div>
  );
}
