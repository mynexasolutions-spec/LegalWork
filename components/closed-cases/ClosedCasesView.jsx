"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Calendar, Eye, FileText, ArrowUpDown, Plus, ClipboardCheck, Gavel, XCircle, MinusCircle, RotateCcw, Trash2, Upload } from "lucide-react";
import Badge from "@/components/Badge";
import ProgressStatCard from "@/components/ProgressStatCard";
import FilterSelect from "@/components/FilterSelect";
import Pagination from "@/components/Pagination";
import RowMenu from "@/components/ui/RowMenu";
import { useStore } from "@/lib/store";
import { useActions } from "@/components/ui/ActionsProvider";
import { caseTypeStyles } from "@/lib/data";
import { caseTypes, formatDate } from "@/lib/cases";
import { resultStyles } from "@/lib/closedCases";

export default function ClosedCasesView() {
  const s = useStore();
  const act = useActions();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [type, setType] = useState("All");
  const [result, setResult] = useState("All");
  const [court, setCourt] = useState("All");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [dir, setDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selected, setSelected] = useState(new Set());

  const closed = useMemo(() => s.cases.filter((c) => c.status === "Closed"), [s.cases]);
  const courts = useMemo(() => [...new Set(closed.map((c) => c.court))].sort(), [closed]);
  const total = closed.length;
  const count = (...r) => closed.filter((c) => r.includes(c.result)).length;
  const pct = (n) => (total ? Math.round((n / total) * 100) : 0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return closed
      .filter((c) => {
        if (type !== "All" && c.type !== type) return false;
        if (result !== "All" && c.result !== result) return false;
        if (court !== "All" && c.court !== court) return false;
        if (from && c.closedDate < from) return false;
        if (to && c.closedDate > to) return false;
        if (q && ![c.title, c.caseNo, c.client, c.court, c.subtitle].some((v) => v.toLowerCase().includes(q))) return false;
        return true;
      })
      .sort((a, b) => (a.closedDate ?? "").localeCompare(b.closedDate ?? "") * (dir === "asc" ? 1 : -1));
  }, [closed, query, type, result, court, from, to, dir]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pages);
  const visible = filtered.slice((current - 1) * pageSize, current * pageSize);
  const allChecked = visible.length > 0 && visible.every((c) => selected.has(c.caseNo));

  const reset = (fn) => (v) => { fn(v); setPage(1); };
  const clear = () => { setQuery(""); setType("All"); setResult("All"); setCourt("All"); setFrom(""); setTo(""); setPage(1); };
  const toggle = (id) => setSelected((x) => { const n = new Set(x); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setSelected((x) => { const n = new Set(x); visible.forEach((c) => (allChecked ? n.delete(c.caseNo) : n.add(c.caseNo))); return n; });

  return (
    <div className="mx-auto flex max-w-350 flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-13 w-13 items-center justify-center rounded-xl bg-indigo-500 text-white"><ClipboardCheck size={26} /></div>
          <div>
            <h1 className="text-3xl font-bold leading-tight">Closed Cases</h1>
            <p className="text-slate-600">All completed and closed cases.</p>
          </div>
        </div>
        <button onClick={() => act.addCase()} className="flex items-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-dark"><Plus size={18} /> Upload Case File</button>
      </div>

      <div className="stagger grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4">
        <ProgressStatCard label="Total Closed Cases" value={total} iconBg="bg-slate-100 text-slate-600" icon={<ClipboardCheck size={30} strokeWidth={1.5} />} />
        <ProgressStatCard label="Won Cases" value={count("Won")} iconBg="bg-emerald-100 text-emerald-600" icon={<Gavel size={30} strokeWidth={1.5} />} bar="bg-emerald-500" barBg="bg-emerald-100" percent={pct(count("Won"))} />
        <ProgressStatCard label="Lost Cases" value={count("Lost")} iconBg="bg-red-100 text-red-500" icon={<XCircle size={30} strokeWidth={1.5} />} bar="bg-red-500" barBg="bg-red-100" percent={pct(count("Lost"))} />
        <ProgressStatCard label="Disposed / Settled" value={count("Settled", "Disposed")} iconBg="bg-amber-100 text-amber-500" icon={<MinusCircle size={30} strokeWidth={1.5} />} bar="bg-amber-400" barBg="bg-amber-100" percent={pct(count("Settled", "Disposed"))} />
      </div>

      <section className="rounded-xl border border-line bg-white shadow-sm">
        <form onSubmit={(e) => e.preventDefault()} className="flex flex-wrap items-end gap-4 p-4">
          <div className="relative min-w-60 flex-1">
            <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input value={query} onChange={(e) => reset(setQuery)(e.target.value)} placeholder="Search by case title, case number, client, court..." className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none focus:border-brand focus:bg-white" />
          </div>
          <FilterSelect label="Case Type" value={type} onChange={reset(setType)} options={caseTypes} />
          <FilterSelect label="Result" value={result} onChange={reset(setResult)} options={["Won", "Lost", "Settled", "Disposed"]} />
          <FilterSelect label="Court" value={court} onChange={reset(setCourt)} options={courts} />
          <div className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm text-slate-600">
            <Calendar size={15} />
            <input type="date" value={from} onChange={(e) => reset(setFrom)(e.target.value)} aria-label="From date" className="w-31 bg-transparent outline-none" />
            <span>-</span>
            <input type="date" value={to} onChange={(e) => reset(setTo)(e.target.value)} aria-label="To date" className="w-31 bg-transparent outline-none" />
          </div>
          <button type="button" onClick={clear} className="h-10 rounded-lg border border-slate-200 px-5 text-sm font-medium hover:bg-slate-50">Clear Filters</button>
          <button type="submit" className="h-10 rounded-lg bg-brand px-6 text-sm font-semibold text-white hover:bg-brand-dark">Search</button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full min-w-225 text-left text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-700">
                <th className="w-10 px-4 py-3"><input type="checkbox" checked={allChecked} onChange={toggleAll} className="h-4 w-4 accent-brand" aria-label="Select all" /></th>
                <th className="px-3 py-3 font-medium">Case Title</th>
                <th className="px-3 py-3 font-medium">Case No.</th>
                <th className="px-3 py-3 font-medium">Client</th>
                <th className="px-3 py-3 font-medium">Type</th>
                <th className="px-3 py-3 font-medium">Court</th>
                <th className="px-3 py-3"><button onClick={() => setDir(dir === "asc" ? "desc" : "asc")} className="flex items-center gap-1.5 font-medium">Closed Date <ArrowUpDown size={13} className="text-indigo-500" /></button></th>
                <th className="px-3 py-3 font-medium">Result</th>
                <th className="px-3 py-3 text-center font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {visible.length === 0 && <tr><td colSpan={9} className="py-16 text-center text-slate-500">No closed cases match your filters.</td></tr>}
              {visible.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3"><input type="checkbox" checked={selected.has(c.caseNo)} onChange={() => toggle(c.caseNo)} className="h-4 w-4 accent-brand" aria-label={`Select ${c.title}`} /></td>
                  <td className="px-3 py-3"><Link href={`/cases/${c.id}`} className="font-semibold hover:text-brand">{c.title}</Link><p className="text-xs text-slate-500">{c.subtitle}</p></td>
                  <td className="px-3 py-3 text-slate-500">{c.caseNo}</td>
                  <td className="px-3 py-3 text-slate-500">{c.client}</td>
                  <td className="px-3 py-3"><Badge className={caseTypeStyles[c.type]}>{c.type}</Badge></td>
                  <td className="px-3 py-3 text-slate-600">{c.court}</td>
                  <td className="px-3 py-3 text-slate-600">{formatDate(c.closedDate)}</td>
                  <td className="px-3 py-3"><Badge className={resultStyles[c.result] ?? "bg-slate-100 text-slate-600"}>{c.result ?? "-"}</Badge></td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <Link href={`/cases/${c.id}`} aria-label="View" className="rounded-md bg-slate-100 p-2 text-slate-700 hover:bg-slate-200"><Eye size={17} /></Link>
                      <button onClick={() => act.upload({ caseNo: c.caseNo })} aria-label="Upload document" title="Upload document" className="rounded-md bg-slate-100 p-2 text-slate-700 hover:bg-slate-200"><FileText size={17} /></button>
                      <RowMenu
                        items={[
                          { label: "View details", icon: Eye, onClick: () => router.push(`/cases/${c.id}`) },
                          { label: "Upload document", icon: Upload, onClick: () => act.upload({ caseNo: c.caseNo }) },
                          { label: "Reopen case", icon: RotateCcw, onClick: () => act.reopenCase(c) },
                          { label: "Delete case", icon: Trash2, danger: true, divider: true, onClick: () => act.deleteCase(c) },
                        ]}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination total={filtered.length} page={current} pageSize={pageSize} onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(1); }} />
      </section>
    </div>
  );
}
