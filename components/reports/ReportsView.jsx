"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BarChart3, Download, FileSpreadsheet, FolderOpen, Gavel, CalendarCheck, TrendingUp, X } from "lucide-react";
import Badge from "@/components/Badge";
import StatCard from "@/components/StatCard";
import ChartCard from "@/components/charts/ChartCard";
import LineChart, { Legend } from "@/components/charts/LineChart";
import Donut from "@/components/charts/Donut";
import HBars from "@/components/charts/HBars";
import { useStore, daysFrom } from "@/lib/store";
import { useToast } from "@/components/ui/Toast";
import { SERIES, MONTHS } from "@/lib/charts";
import { formatDate } from "@/lib/cases";
import { formatSize, downloadBlob, toCsv } from "@/lib/format";
import { resultStyles } from "@/lib/closedCases";
import { defaultAssigned } from "@/lib/team";
import { caseTypeStyles } from "@/lib/data";

const RANGES = [["3 months", 3], ["6 months", 6], ["12 months", 12]];
const OUTCOMES = ["Won", "Lost", "Settled", "Disposed"];
const OUTCOME_COLOR = { Won: SERIES[0], Lost: SERIES[1], Settled: SERIES[2], Disposed: SERIES[3] };
const series = [
  { key: "filed", label: "Cases filed", color: SERIES[0] },
  { key: "closed", label: "Cases closed", color: SERIES[1] },
];

export default function ReportsView() {
  const s = useStore();
  const toast = useToast();
  const [months, setMonths] = useState(6);
  const [outcome, setOutcome] = useState(null);

  // month buckets ending with the current month
  const buckets = useMemo(() => {
    const y = Number(s.today.slice(0, 4));
    const m = Number(s.today.slice(5, 7)) - 1;
    return Array.from({ length: months }, (_, i) => {
      const d = new Date(Date.UTC(y, m - (months - 1 - i), 1));
      return { key: d.toISOString().slice(0, 7), label: MONTHS[d.getUTCMonth()] };
    });
  }, [s.today, months]);
  const startKey = buckets[0].key;
  const inRange = (date) => !!date && date.slice(0, 7) >= startKey && date.slice(0, 7) <= s.today.slice(0, 7);

  const filed = s.cases.filter((c) => inRange(c.filed));
  const closed = s.cases.filter((c) => c.status === "Closed" && inRange(c.closedDate));
  const held = s.hearings.filter((h) => h.status === "Completed" && inRange(h.date));
  const decided = closed.filter((c) => OUTCOMES.includes(c.result));
  const won = decided.filter((c) => c.result === "Won").length;
  const winRate = decided.length ? Math.round((won / decided.length) * 100) : 0;

  const monthly = buckets.map((b) => ({
    label: b.label,
    values: {
      filed: s.cases.filter((c) => c.filed.slice(0, 7) === b.key).length,
      closed: s.cases.filter((c) => c.status === "Closed" && c.closedDate?.slice(0, 7) === b.key).length,
    },
  }));

  const outcomes = OUTCOMES.map((o) => ({ key: o, label: o, value: closed.filter((c) => c.result === o).length, color: OUTCOME_COLOR[o] }));
  const courts = Object.entries(filed.reduce((a, c) => ({ ...a, [c.court]: (a[c.court] ?? 0) + 1 }), {})).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([k, v]) => ({ key: k, label: k, value: v }));
  const workload = s.members
    .filter((m) => m.status === "Active")
    .map((m) => ({ key: m.id, label: m.name.split(" ")[0], value: (m.assignedCases ?? defaultAssigned(m, s.cases)).length }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const shown = outcome ? closed.filter((c) => c.result === outcome) : closed;
  const total = closed.length;
  const share = (v) => (total ? `${Math.round((v / total) * 100)}%` : "0%");

  const reports = [
    { title: "Case register", note: `${s.cases.length} cases with client, type, court and status`, file: "case-register.csv", head: ["Case No.", "Title", "Client", "Type", "Court", "Status", "Filed", "Next Hearing"], rows: () => s.cases.map((c) => [c.caseNo, c.title, c.client, c.type, c.court, c.status, formatDate(c.filed), c.hearingDate ? formatDate(c.hearingDate) : ""]) },
    { title: "Hearing schedule", note: `${s.hearings.length} hearings, upcoming and past`, file: "hearings.csv", head: ["Date", "Time", "Case", "Court", "Purpose", "Status"], rows: () => [...s.hearings].sort((a, b) => a.date.localeCompare(b.date)).map((h) => [formatDate(h.date), h.time, s.caseTitle(h.caseNo), h.court, h.purpose, h.status]) },
    { title: "Closed cases & outcomes", note: `${closed.length} closed in the selected range`, file: "closed-cases.csv", head: ["Case No.", "Title", "Client", "Outcome", "Closed On"], rows: () => closed.map((c) => [c.caseNo, c.title, c.client, c.result, formatDate(c.closedDate)]) },
    { title: "Client list", note: `${s.clients.length} clients with contact details`, file: "clients.csv", head: ["Name", "Type", "Phone", "Email", "City", "Cases", "Status"], rows: () => s.clients.map((c) => [c.name, c.type, c.phone, c.email, c.city, c.totalCases, c.status]) },
    { title: "Document index", note: `${s.documents.filter((d) => !d.trashed).length} documents with case and size`, file: "documents.csv", head: ["Name", "Type", "Case", "Added", "Size", "Uploaded by"], rows: () => s.documents.filter((d) => !d.trashed).map((d) => [d.name, d.type, d.caseNo ? s.caseTitle(d.caseNo) : "General", formatDate(d.date), formatSize(d.sizeKb), d.by]) },
  ];
  const download = (r) => {
    downloadBlob(new Blob([toCsv(r.head, r.rows())], { type: "text/csv" }), r.file);
    toast(`${r.title} downloaded`);
  };

  return (
    <div className="mx-auto flex max-w-350 flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-13 w-13 items-center justify-center rounded-xl bg-emerald-600 text-white"><BarChart3 size={26} /></div>
          <div>
            <h1 className="text-3xl font-bold leading-tight">Reports</h1>
            <p className="text-slate-600">Practice performance at a glance, with downloadable reports.</p>
          </div>
        </div>
        <div role="radiogroup" aria-label="Report range" className="flex rounded-lg border border-line bg-white p-0.5 text-sm shadow-sm">
          {RANGES.map(([label, n]) => (
            <button key={n} role="radio" aria-checked={months === n} onClick={() => { setMonths(n); setOutcome(null); }} className={`rounded-md px-4 py-2 font-medium transition ${months === n ? "bg-peach text-sidebar shadow-sm" : "text-slate-600 hover:bg-slate-50"}`}>Last {label}</button>
          ))}
        </div>
      </div>

      <div className="stagger grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4">
        <StatCard label="Cases filed" value={filed.length} iconBg="bg-blue-100 text-blue-600" icon={<FolderOpen size={30} strokeWidth={1.5} />} />
        <StatCard label="Cases closed" value={closed.length} iconBg="bg-indigo-100 text-indigo-600" icon={<Gavel size={30} strokeWidth={1.5} />} />
        <StatCard label="Win rate" value={winRate} note={decided.length ? `${won} of ${decided.length}` : "no closed cases"} iconBg="bg-emerald-100 text-emerald-600" icon={<TrendingUp size={30} strokeWidth={1.5} />} />
        <StatCard label="Hearings held" value={held.length} iconBg="bg-orange-100 text-orange-500" icon={<CalendarCheck size={30} strokeWidth={1.5} />} />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.8fr_1fr]">
        <ChartCard title="Cases filed vs closed" subtitle={`By month, last ${months} months`} legend={<Legend items={series} />} table={{ head: ["Month", "Filed", "Closed"], rows: monthly.map((d) => [d.label, d.values.filed, d.values.closed]) }}>
          <LineChart data={monthly} series={series} ariaLabel={`Cases filed and closed per month over the last ${months} months`} />
        </ChartCard>
        <ChartCard title="Outcomes" subtitle="Click a slice to filter the closed cases below" table={{ head: ["Outcome", "Cases", "Share"], rows: outcomes.map((o) => [o.label, o.value, share(o.value)]) }}>
          <Donut slices={outcomes} selected={outcome} onSelect={setOutcome} centerLabel="Closed cases" ariaLabel="Closed cases by outcome" />
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <ChartCard title="Cases by court" subtitle="Cases filed in the range" table={{ head: ["Court", "Cases"], rows: courts.map((c) => [c.label, c.value]) }}>
          {courts.length ? <HBars rows={courts} total={filed.length} /> : <p className="py-10 text-center text-sm text-slate-500">No cases filed in this range.</p>}
        </ChartCard>
        <ChartCard title="Team workload" subtitle="Cases assigned per active member" table={{ head: ["Member", "Cases"], rows: workload.map((w) => [w.label, w.value]) }}>
          <HBars rows={workload} color={SERIES[2]} />
        </ChartCard>
      </div>

      <section className="rounded-xl border border-line bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h2 className="text-lg font-bold">Closed cases in range</h2>
          {outcome && <span className="anim-fade flex items-center gap-1.5 rounded-full bg-orange-50 py-1 pl-3 pr-1.5 text-xs font-medium text-brand">{outcome}<button onClick={() => setOutcome(null)} aria-label="Clear outcome filter" className="rounded-full p-0.5 hover:bg-orange-100"><X size={12} /></button></span>}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-150 text-left text-sm">
            <thead><tr className="bg-slate-50 text-slate-600">{["Case", "Client", "Type", "Outcome", "Closed on"].map((h) => <th key={h} className="px-3 py-2.5 font-medium">{h}</th>)}</tr></thead>
            <tbody className="divide-y divide-line">
              {shown.length === 0 && <tr><td colSpan={5} className="py-10 text-center text-slate-500">No closed cases in this range.</td></tr>}
              {shown.map((c) => (
                <tr key={c.id}>
                  <td className="px-3 py-3"><Link href={`/cases/${c.id}`} className="font-semibold hover:text-brand">{c.title}</Link><p className="text-xs text-slate-500">{c.caseNo}</p></td>
                  <td className="px-3 py-3 text-slate-600">{c.client}</td>
                  <td className="px-3 py-3"><Badge className={caseTypeStyles[c.type]}>{c.type}</Badge></td>
                  <td className="px-3 py-3"><Badge className={resultStyles[c.result] ?? "bg-slate-100 text-slate-600"}>{c.result ?? "-"}</Badge></td>
                  <td className="px-3 py-3 text-slate-600">{formatDate(c.closedDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border border-line bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-bold">Download reports</h2>
        <ul className="stagger grid grid-cols-1 gap-3 lg:grid-cols-2">
          {reports.map((r) => (
            <li key={r.file} className="lift flex items-center gap-4 rounded-xl border border-line p-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600"><FileSpreadsheet size={22} /></span>
              <span className="min-w-0 flex-1 text-sm leading-snug"><span className="block font-semibold">{r.title}</span><span className="block text-xs text-slate-500">{r.note}</span></span>
              <button onClick={() => download(r)} className="flex items-center gap-2 rounded-lg border border-line px-4 py-2 text-xs font-medium hover:bg-slate-50"><Download size={14} /> CSV</button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
