"use client";

import { useState } from "react";
import { Table2, BarChart3 } from "lucide-react";

// A chart frame with a built-in "table view" so every value is reachable without hovering.
export default function ChartCard({ title, subtitle, legend, table, children, className = "" }) {
  const [asTable, setAsTable] = useState(false);
  return (
    <section className={`lift flex flex-col rounded-xl border border-line bg-white p-5 shadow-sm ${className}`}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold">{title}</h2>
          {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
        </div>
        <button
          onClick={() => setAsTable(!asTable)}
          aria-pressed={asTable}
          aria-label={asTable ? "Show chart" : "Show data table"}
          title={asTable ? "Show chart" : "Show data table"}
          className="rounded-md border border-line p-1.5 text-slate-500 hover:bg-slate-50 hover:text-ink"
        >
          {asTable ? <BarChart3 size={15} /> : <Table2 size={15} />}
        </button>
      </div>
      {legend && !asTable && <div className="mb-2">{legend}</div>}
      <div className="min-h-0 flex-1">
        {asTable ? (
          <div className="anim-fade max-h-64 overflow-auto">
            <table className="keep-table w-full text-left text-sm">
              <thead>
                <tr className="text-xs text-slate-500">{table.head.map((h, i) => <th key={h} className={`border-b border-line px-2 py-2 font-medium ${i ? "text-right" : ""}`}>{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-line">
                {table.rows.map((r, i) => (
                  <tr key={i}>{r.map((c, j) => <td key={j} className={`px-2 py-1.5 ${j ? "text-right tabular-nums" : ""}`}>{c}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          children
        )}
      </div>
    </section>
  );
}
