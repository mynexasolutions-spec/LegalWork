"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, Calendar, Download, Table, LayoutGrid, Plus, Folder, CheckCircle2, Clock, ChevronRight, Trash2, X } from "lucide-react";
import { FaBalanceScale } from "react-icons/fa";
import ProgressStatCard from "@/components/ProgressStatCard";
import FilterSelect from "@/components/FilterSelect";
import Pagination from "@/components/Pagination";
import CasesTable from "./CasesTable";
import CasesCards from "./CasesCards";
import { useStore } from "@/lib/store";
import { useActions } from "@/components/ui/ActionsProvider";
import { useToast } from "@/components/ui/Toast";
import { caseTypes, formatDate } from "@/lib/cases";
import { downloadBlob, toCsv } from "@/lib/format";

const TABS = ["All Cases", "Active", "Closed", "Pending", "Drafts"];
const tabStatus = { Active: "Active", Closed: "Closed", Pending: "Pending", Drafts: "Draft" };

export function exportCases(cases, filename = "cases.csv") {
  const head = ["Case Title", "Case No.", "Client", "Type", "Status", "Court", "Next Hearing", "Last Updated"];
  const rows = cases.map((c) => [c.title, c.caseNo, c.client, c.type, c.status, c.court, c.hearingDate ? `${formatDate(c.hearingDate)} ${c.hearingTime}` : "", formatDate(c.updated)]);
  downloadBlob(new Blob([toCsv(head, rows)], { type: "text/csv" }), filename);
}

export default function CasesView() {
  const s = useStore();
  const act = useActions();
  const toast = useToast();
  const [tab, setTab] = useState("All Cases");
  const [view, setView] = useState("table");
  const [query, setQuery] = useState("");
  const [type, setType] = useState("All");
  const [status, setStatus] = useState("All");
  const [court, setCourt] = useState("All");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState({ key: null, dir: "asc" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState(new Set());

  const all = s.cases;
  const courts = useMemo(() => [...new Set(all.map((c) => c.court))].sort(), [all]);
  const countFor = (t) => (t === "All Cases" ? all.length : all.filter((c) => c.status === tabStatus[t]).length);
  const total = all.length;
  const pct = (n) => (total ? Math.round((n / total) * 100) : 0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = all.filter((c) => {
      if (tab !== "All Cases" && c.status !== tabStatus[tab]) return false;
      if (type !== "All" && c.type !== type) return false;
      if (status !== "All" && c.status !== status) return false;
      if (court !== "All" && c.court !== court) return false;
      if (from && (!c.hearingDate || c.hearingDate < from)) return false;
      if (to && (!c.hearingDate || c.hearingDate > to)) return false;
      if (q && ![c.title, c.caseNo, c.client, c.court, c.subtitle].some((v) => v.toLowerCase().includes(q))) return false;
      return true;
    });
    if (sort.key) {
      const dir = sort.dir === "asc" ? 1 : -1;
      list = [...list].sort((a, b) => {
        if (!a[sort.key]) return 1; // cases without a date always go last
        if (!b[sort.key]) return -1;
        return a[sort.key].localeCompare(b[sort.key]) * dir;
      });
    }
    return list;
  }, [all, tab, type, status, court, from, to, query, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pages);
  const visible = filtered.slice((current - 1) * pageSize, current * pageSize);

  const reset = (fn) => (v) => { fn(v); setPage(1); };
  const clearFilters = () => { setQuery(""); setType("All"); setStatus("All"); setCourt("All"); setFrom(""); setTo(""); setTab("All Cases"); setPage(1); };
  const toggleSort = (key) => setSort((x) => (x.key === key ? { key, dir: x.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  const toggle = (id) => setSelected((x) => { const n = new Set(x); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () =>
    setSelected((x) => {
      const n = new Set(x);
      const every = visible.every((c) => n.has(c.caseNo));
      visible.forEach((c) => (every ? n.delete(c.caseNo) : n.add(c.caseNo)));
      return n;
    });

  const chosen = all.filter((c) => selected.has(c.caseNo));
  const deleteChosen = () =>
    act.confirm({
      title: `Delete ${chosen.length} case${chosen.length > 1 ? "s" : ""}?`,
      message: "Their hearings and reminders will be removed and documents moved to Trash.",
      confirmLabel: "Delete",
      danger: true,
      onConfirm: () => { chosen.forEach((c) => s.deleteCase(c.caseNo)); setSelected(new Set()); toast(`${chosen.length} case(s) deleted`); },
    });

  return (
    <div className="mx-auto flex max-w-350 flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-13 w-13 items-center justify-center rounded-xl bg-brand text-white"><Folder size={26} /></div>
          <div>
            <h1 className="text-3xl font-bold leading-tight">My Cases</h1>
            <p className="text-slate-600">All cases assigned to you. View, manage and track your cases.</p>
          </div>
        </div>
        <button onClick={() => act.addCase()} className="flex items-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-dark"><Plus size={18} /> Upload Case File</button>
      </div>

      <nav className="flex items-center gap-2 text-sm text-slate-600">
        <Link href="/" className="hover:text-brand">Dashboard</Link><ChevronRight size={14} /><span className="text-ink">My Cases</span>
      </nav>

      <div className="stagger grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4">
        <ProgressStatCard label="Total My Cases" value={total} iconBg="bg-orange-100 text-orange-500" icon={<Folder size={30} strokeWidth={1.5} />} />
        <ProgressStatCard label="Active Cases" value={countFor("Active")} iconBg="bg-emerald-100 text-emerald-600" icon={<FaBalanceScale size={28} />} bar="bg-emerald-500" barBg="bg-emerald-100" percent={pct(countFor("Active"))} />
        <ProgressStatCard label="Closed Cases" value={countFor("Closed")} iconBg="bg-indigo-100 text-indigo-600" icon={<CheckCircle2 size={30} strokeWidth={1.5} />} bar="bg-indigo-500" barBg="bg-indigo-100" percent={pct(countFor("Closed"))} />
        <ProgressStatCard label="Pending / Others" value={countFor("Pending")} iconBg="bg-amber-100 text-amber-500" icon={<Clock size={30} strokeWidth={1.5} />} bar="bg-amber-400" barBg="bg-amber-100" percent={pct(countFor("Pending"))} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setPage(1); }}
              className={`flex items-center gap-2.5 rounded-lg border px-5 py-2.5 text-sm font-medium transition ${tab === t ? "border-brand bg-orange-50 text-ink" : "border-transparent bg-white text-slate-700 hover:border-line"}`}
            >
              {t}
              <span className={`flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs ${tab === t ? "bg-sidebar text-white" : "bg-slate-100 text-slate-700"}`}>{countFor(t)}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {[["table", "Table", Table], ["card", "Card", LayoutGrid]].map(([key, label, Icon]) => (
            <button key={key} onClick={() => setView(key)} className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium ${view === key ? "border-brand bg-white" : "border-line bg-white/70 hover:bg-white"}`}>
              <Icon size={16} /> {label}
            </button>
          ))}
          <button onClick={() => { exportCases(filtered); toast(`Exported ${filtered.length} cases`); }} className="flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-medium hover:bg-slate-50"><Download size={16} /> Export</button>
        </div>
      </div>

      <section className="rounded-xl border border-line bg-white shadow-sm">
        <form onSubmit={(e) => e.preventDefault()} className="flex flex-wrap items-end gap-4 p-4">
          <div className="relative min-w-60 flex-1">
            <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input value={query} onChange={(e) => reset(setQuery)(e.target.value)} placeholder="Search by case title, case number, client, court..." className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none focus:border-brand focus:bg-white" />
          </div>
          <FilterSelect label="Case Type" value={type} onChange={reset(setType)} options={caseTypes} />
          <FilterSelect label="Status" value={status} onChange={reset(setStatus)} options={["Active", "Pending", "Closed"]} />
          <FilterSelect label="Court" value={court} onChange={reset(setCourt)} options={courts} />
          <div>
            <span className="mb-1 block text-xs font-medium text-slate-600">Next Hearing</span>
            <div className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm text-slate-600">
              <Calendar size={15} />
              <input type="date" value={from} onChange={(e) => reset(setFrom)(e.target.value)} aria-label="From date" className="w-31 bg-transparent outline-none" />
              <span>-</span>
              <input type="date" value={to} onChange={(e) => reset(setTo)(e.target.value)} aria-label="To date" className="w-31 bg-transparent outline-none" />
            </div>
          </div>
          <button type="button" onClick={clearFilters} className="h-10 rounded-lg border border-slate-200 px-5 text-sm font-medium hover:bg-slate-50">Clear Filters</button>
          <button type="submit" className="h-10 rounded-lg bg-brand px-6 text-sm font-semibold text-white hover:bg-brand-dark">Search</button>
        </form>

        {chosen.length > 0 && (
          <div className="anim-drop mx-4 mb-3 flex flex-wrap items-center gap-3 rounded-lg bg-orange-50 px-4 py-2.5 text-sm">
            <b>{chosen.length} selected</b>
            <button onClick={() => { exportCases(chosen, "selected-cases.csv"); toast("Exported selected cases"); }} className="flex items-center gap-1.5 font-medium text-slate-700 hover:text-brand"><Download size={14} /> Export</button>
            <button onClick={deleteChosen} className="flex items-center gap-1.5 font-medium text-red-600"><Trash2 size={14} /> Delete</button>
            <button onClick={() => setSelected(new Set())} className="ml-auto flex items-center gap-1 text-slate-500 hover:text-ink"><X size={14} /> Clear</button>
          </div>
        )}

        {view === "table" ? (
          <CasesTable cases={visible} selected={selected} onToggle={toggle} onToggleAll={toggleAll} sort={sort} onSort={toggleSort} />
        ) : (
          <CasesCards cases={visible} />
        )}

        <Pagination total={filtered.length} page={current} pageSize={pageSize} onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(1); }} />
      </section>
    </div>
  );
}
