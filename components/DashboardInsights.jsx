"use client";

import { useMemo, useState } from "react";
import { X } from "lucide-react";
import ChartCard from "@/components/charts/ChartCard";
import LineChart, { Legend } from "@/components/charts/LineChart";
import Donut from "@/components/charts/Donut";
import HBars from "@/components/charts/HBars";
import { useStore } from "@/lib/store";
import { SERIES, STATUS_COLOR, weekBuckets } from "@/lib/charts";
import { caseTypes } from "@/lib/cases";

const WINDOWS = [4, 8, 12];
const STATUSES = ["Active", "Pending", "Closed"];
const hearingSeries = [
  { key: "scheduled", label: "Scheduled", color: SERIES[0] },
  { key: "completed", label: "Completed", color: SERIES[1] },
];

// filters: { type, status } - clicking a bar or slice sets them and the Recent Cases table follows
export default function DashboardInsights({ filters, setFilters }) {
  const s = useStore();
  const [weeks, setWeeks] = useState(8);

  const buckets = useMemo(() => weekBuckets(s.today, weeks), [s.today, weeks]);
  const data = useMemo(
    () =>
      buckets.map((b) => {
        const inWeek = s.hearings.filter((h) => h.date >= b.start && h.date <= b.end);
        return { label: b.label, values: { scheduled: inWeek.filter((h) => h.status === "Scheduled").length, completed: inWeek.filter((h) => h.status === "Completed").length } };
      }),
    [buckets, s.hearings]
  );

  const byStatus = STATUSES.map((st) => ({ key: st, label: st, value: s.cases.filter((c) => c.status === st).length, color: STATUS_COLOR[st] }));
  const byType = caseTypes.map((t) => ({ key: t, label: t, value: s.cases.filter((c) => c.type === t).length }));
  const total = s.cases.length;
  const pct = (v) => (total ? `${Math.round((v / total) * 100)}%` : "0%");
  const active = filters.type || filters.status;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-lg font-bold">Insights</h2>
        <div role="radiogroup" aria-label="Hearing window" className="flex rounded-lg border border-line bg-white p-0.5 text-sm">
          {WINDOWS.map((w) => (
            <button key={w} role="radio" aria-checked={weeks === w} onClick={() => setWeeks(w)} className={`rounded-md px-3.5 py-1.5 font-medium transition ${weeks === w ? "bg-peach text-sidebar shadow-sm" : "text-slate-600 hover:bg-slate-50"}`}>
              {w} weeks
            </button>
          ))}
        </div>
        <span className="text-xs text-slate-500">window either side of today, scopes the hearings chart</span>
        {active && (
          <div className="anim-fade ml-auto flex flex-wrap items-center gap-2 text-xs">
            <span className="text-slate-500">Recent cases filtered by</span>
            {filters.type && <Chip onClear={() => setFilters({ ...filters, type: null })}>{filters.type}</Chip>}
            {filters.status && <Chip onClear={() => setFilters({ ...filters, status: null })}>{filters.status}</Chip>}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.8fr_1fr_1fr]">
        <ChartCard
          title="Hearings per week"
          subtitle="Scheduled vs completed hearings"
          legend={<Legend items={hearingSeries} />}
          table={{
            head: ["Week of", "Scheduled", "Completed"],
            rows: data.map((d) => [d.label, d.values.scheduled, d.values.completed]),
          }}
        >
          <LineChart data={data} series={hearingSeries} markIndex={weeks} ariaLabel={`Hearings per week, ${weeks} weeks either side of today`} />
        </ChartCard>

        <ChartCard
          title="Case status"
          subtitle="Click a slice to filter recent cases"
          table={{ head: ["Status", "Cases", "Share"], rows: byStatus.map((x) => [x.label, x.value, pct(x.value)]) }}
        >
          <Donut slices={byStatus} selected={filters.status} onSelect={(k) => setFilters({ ...filters, status: k })} centerLabel="Total cases" ariaLabel="Cases by status" />
        </ChartCard>

        <ChartCard
          title="Cases by type"
          subtitle="Click a bar to filter recent cases"
          table={{ head: ["Type", "Cases", "Share"], rows: byType.map((x) => [x.label, x.value, pct(x.value)]) }}
        >
          <HBars rows={byType} selected={filters.type} onSelect={(k) => setFilters({ ...filters, type: k })} total={total} />
        </ChartCard>
      </div>
    </div>
  );
}

function Chip({ children, onClear }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-orange-50 py-1 pl-3 pr-1.5 font-medium text-brand">
      {children}
      <button onClick={onClear} aria-label={`Clear ${children} filter`} className="rounded-full p-0.5 hover:bg-orange-100"><X size={12} /></button>
    </span>
  );
}
