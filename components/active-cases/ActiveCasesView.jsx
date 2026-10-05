"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Calendar, Eye, Pencil, ArrowUpDown, Plus, FileText, CalendarDays, Clock, Users } from "lucide-react";
import Badge from "@/components/Badge";
import StatCard from "@/components/StatCard";
import FilterSelect from "@/components/FilterSelect";
import Pagination from "@/components/Pagination";
import RowMenu from "@/components/ui/RowMenu";
import { caseMenu } from "@/components/cases/caseMenu";
import { useStore, daysFrom } from "@/lib/store";
import { useActions } from "@/components/ui/ActionsProvider";
import { caseTypeStyles, statusStyles } from "@/lib/data";
import { caseTypes, formatDate } from "@/lib/cases";

const RANGES = { "Next 7 days": 7, "Next 30 days": 30, "Next 60 days": 60 };

export default function ActiveCasesView() {
  const s = useStore();
  const act = useActions();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [type, setType] = useState("All");
  const [court, setCourt] = useState("All");
  const [range, setRange] = useState("All");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [dir, setDir] = useState("asc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState(new Set());

  const active = useMemo(() => s.cases.filter((c) => c.status === "Active"), [s.cases]);
  const courts = useMemo(() => [...new Set(active.map((c) => c.court))].sort(), [active]);

  const upcoming7 = s.hearings.filter((h) => h.status === "Scheduled" && h.date >= s.today && daysFrom(s.today, h.date) <= 7 && active.some((c) => c.caseNo === h.caseNo)).length;
  const pendingTasks = s.reminders.filter((r) => !r.completed).length;
  const withHearingSoon = active.filter((c) => c.hearingDate && daysFrom(s.today, c.hearingDate) <= 30).length;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = active.filter((c) => {
      if (type !== "All" && c.type !== type) return false;
      if (court !== "All" && c.court !== court) return false;
      if (range !== "All" && (!c.hearingDate || daysFrom(s.today, c.hearingDate) > RANGES[range])) return false;
      if (from && (!c.hearingDate || c.hearingDate < from)) return false;
      if (to && (!c.hearingDate || c.hearingDate > to)) return false;
      if (q && ![c.title, c.caseNo, c.client, c.court, c.subtitle].some((v) => v.toLowerCase().includes(q))) return false;
      return true;
    });
    return list.sort((a, b) => {
      if (!a.hearingDate) return 1; // no hearing scheduled: always last
      if (!b.hearingDate) return -1;
      return a.hearingDate.localeCompare(b.hearingDate) * (dir === "asc" ? 1 : -1);
    });
  }, [active, query, type, court, range, from, to, dir, s.today]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pages);
  const visible = filtered.slice((current - 1) * pageSize, current * pageSize);
  const allChecked = visible.length > 0 && visible.every((c) => selected.has(c.caseNo));

  const reset = (fn) => (v) => { fn(v); setPage(1); };
  const clear = () => { setQuery(""); setType("All"); setCourt("All"); setRange("All"); setFrom(""); setTo(""); setPage(1); };
  const toggle = (id) => setSelected((x) => { const n = new Set(x); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelected((x) => { const n = new Set(x); visible.forEach((c) => (allChecked ? n.delete(c.caseNo) : n.add(c.caseNo))); return n; });

  return (
    <div className="mx-auto flex max-w-350 flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl sm:h-13 sm:w-13 bg-emerald-600 text-white"><FileText size={26} /></div>
          <div className="min-w-0">
            <h1 className="text-3xl font-bold leading-tight">Active Cases</h1>
            <p className="text-slate-600">All currently active and ongoing cases.</p>
          </div>
        </div>
        <button onClick={() => act.addCase()} className="flex items-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-dark"><Plus size={18} /> Upload Case File</button>
      </div>

      <div className="stagger grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4">
        <StatCard label="Total Active Cases" value={active.length} iconBg="bg-emerald-100 text-emerald-600" icon={<FileText size={30} strokeWidth={1.5} />} />
        <StatCard label="Upcoming Hearings" value={upcoming7} note="Next 7 days" iconBg="bg-red-100 text-red-600" icon={<CalendarDays size={30} strokeWidth={1.5} />} onClick={() => router.push("/hearings")} />
        <StatCard label="Pending Tasks" value={pendingTasks} iconBg="bg-amber-100 text-amber-500" icon={<Clock size={30} strokeWidth={1.5} />} onClick={() => router.push("/reminders")} />
        <StatCard label="My Active Cases" value={withHearingSoon} iconBg="bg-blue-100 text-blue-600" icon={<Users size={30} strokeWidth={1.5} />} />
      </div>

      <section className="rounded-xl border border-line bg-white shadow-sm">
        <form onSubmit={(e) => e.preventDefault()} className="flex flex-wrap items-end gap-4 p-4">
          <div className="relative min-w-60 flex-1">
            <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input value={query} onChange={(e) => reset(setQuery)(e.target.value)} placeholder="Search by case title, case number, client, court..." className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none focus:border-brand focus:bg-white" />
          </div>
          <FilterSelect label="Case Type" value={type} onChange={reset(setType)} options={caseTypes} />
          <FilterSelect label="Court" value={court} onChange={reset(setCourt)} options={courts} />
          <FilterSelect label="Next Hearing" value={range} onChange={reset(setRange)} options={Object.keys(RANGES)} />
          <div className="flex h-10 w-full items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm text-slate-600 sm:w-auto">
            <Calendar size={15} />
            <input type="date" value={from} onChange={(e) => reset(setFrom)(e.target.value)} aria-label="From date" className="min-w-0 flex-1 bg-transparent outline-none sm:w-31 sm:flex-none" />
            <span>-</span>
            <input type="date" value={to} onChange={(e) => reset(setTo)(e.target.value)} aria-label="To date" className="min-w-0 flex-1 bg-transparent outline-none sm:w-31 sm:flex-none" />
          </div>
          <button type="button" onClick={clear} className="h-10 rounded-lg border border-slate-200 px-5 text-sm font-medium hover:bg-slate-50">Clear Filters</button>
          <button type="submit" className="h-10 rounded-lg bg-brand px-6 text-sm font-semibold text-white hover:bg-brand-dark">Search</button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full min-w-250 text-left text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-700">
                <th className="w-10 px-4 py-3"><input type="checkbox" checked={allChecked} onChange={toggleAll} className="h-4 w-4 accent-brand" aria-label="Select all" /></th>
                <th className="px-3 py-3 font-medium">Case Title</th>
                <th className="px-3 py-3 font-medium">Case No.</th>
                <th className="px-3 py-3 font-medium">Client</th>
                <th className="px-3 py-3 font-medium">Type</th>
                <th className="px-3 py-3 font-medium">Court</th>
                <th className="px-3 py-3"><button onClick={() => setDir(dir === "asc" ? "desc" : "asc")} className="flex items-center gap-1.5 font-medium text-emerald-700">Next Hearing <ArrowUpDown size={13} /></button></th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 text-center font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {visible.length === 0 && <tr><td colSpan={9} className="py-16 text-center text-slate-500">No active cases match your filters.</td></tr>}
              {visible.map((c) => {
                const days = c.hearingDate ? daysFrom(s.today, c.hearingDate) : null;
                return (
                  <tr key={c.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3"><input type="checkbox" checked={selected.has(c.caseNo)} onChange={() => toggle(c.caseNo)} className="h-4 w-4 accent-brand" aria-label={`Select ${c.title}`} /></td>
                    <td className="px-3 py-3"><Link href={`/cases/${c.id}`} className="font-semibold hover:text-brand">{c.title}</Link><p className="text-xs text-slate-500">{c.subtitle}</p></td>
                    <td className="px-3 py-3 text-slate-500">{c.caseNo}</td>
                    <td className="px-3 py-3 text-slate-500">{c.client}</td>
                    <td className="px-3 py-3"><Badge className={caseTypeStyles[c.type]}>{c.type}</Badge></td>
                    <td className="px-3 py-3 text-slate-600">{c.court}</td>
                    <td className="px-3 py-3">
                      {c.hearingDate ? (
                        <div className="flex items-center gap-3 text-emerald-700">
                          <Calendar size={16} />
                          <div className="text-xs leading-tight"><p className="font-medium">{formatDate(c.hearingDate)}</p><p className="opacity-80">{c.hearingTime}</p></div>
                          <span className="ml-2 rounded-md bg-red-50 px-2.5 py-1 text-xs text-red-500">{days === 0 ? "Today" : `${days} ${days === 1 ? "day" : "days"}`}</span>
                        </div>
                      ) : (
                        <button onClick={() => act.addHearing({ caseNo: c.caseNo })} className="text-xs font-medium text-brand hover:underline">+ Schedule</button>
                      )}
                    </td>
                    <td className="px-3 py-3"><Badge className={statusStyles[c.status]}>{c.status}</Badge></td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <Link href={`/cases/${c.id}`} aria-label="View" className="rounded-md bg-slate-100 p-2 text-slate-700 hover:bg-slate-200"><Eye size={17} /></Link>
                        <button onClick={() => act.editCase(c)} aria-label="Edit" className="rounded-md bg-slate-100 p-2 text-slate-700 hover:bg-slate-200"><Pencil size={17} /></button>
                        <RowMenu items={caseMenu(c, act, router)} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <Pagination total={filtered.length} page={current} pageSize={pageSize} onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(1); }} />
      </section>
    </div>
  );
}
