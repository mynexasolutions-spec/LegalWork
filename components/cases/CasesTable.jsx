"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, Pencil, Calendar, ArrowUpDown } from "lucide-react";
import Badge from "@/components/Badge";
import RowMenu from "@/components/ui/RowMenu";
import { useActions } from "@/components/ui/ActionsProvider";
import { caseMenu } from "./caseMenu";
import { caseTypeStyles, statusStyles } from "@/lib/data";
import { formatDate } from "@/lib/cases";

function HearingCell({ c }) {
  if (!c.hearingDate) return <span className="pl-2 text-slate-400">-</span>;
  const pending = c.status === "Pending";
  return (
    <div className={`flex w-37.5 items-center gap-2.5 rounded-md px-3 py-1.5 ${pending ? "bg-amber-50 text-amber-700" : "bg-emerald-50 text-emerald-700"}`}>
      <Calendar size={16} />
      <div className="text-xs leading-tight">
        <p className="font-medium">{formatDate(c.hearingDate)}</p>
        <p className="opacity-80">{c.hearingTime}</p>
      </div>
    </div>
  );
}

function SortHead({ label, active, onClick }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1.5 font-medium">
      {label}
      <ArrowUpDown size={13} className={active ? "text-brand" : "text-slate-500"} />
    </button>
  );
}

export default function CasesTable({ cases, selected, onToggle, onToggleAll, sort, onSort }) {
  const act = useActions();
  const router = useRouter();
  const allChecked = cases.length > 0 && cases.every((c) => selected.has(c.caseNo));

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-250 text-left text-sm">
        <thead>
          <tr className="bg-slate-50 text-slate-700">
            <th className="w-10 px-4 py-3">
              <input type="checkbox" checked={allChecked} onChange={onToggleAll} className="h-4 w-4 accent-brand" aria-label="Select all" />
            </th>
            <th className="px-3 py-3 font-medium">Case Title</th>
            <th className="px-3 py-3 font-medium">Case No.</th>
            <th className="px-3 py-3 font-medium">Client</th>
            <th className="px-3 py-3 font-medium">Type</th>
            <th className="px-3 py-3 font-medium">Status</th>
            <th className="px-3 py-3"><SortHead label="Next Hearing" active={sort.key === "hearingDate"} onClick={() => onSort("hearingDate")} /></th>
            <th className="px-3 py-3"><SortHead label="Last Updated" active={sort.key === "updated"} onClick={() => onSort("updated")} /></th>
            <th className="px-3 py-3 text-center font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {cases.length === 0 && (
            <tr><td colSpan={9} className="py-16 text-center text-slate-500">No cases match your filters.</td></tr>
          )}
          {cases.map((c) => (
            <tr key={c.id} className="hover:bg-slate-50/60">
              <td className="px-4 py-3">
                <input type="checkbox" checked={selected.has(c.caseNo)} onChange={() => onToggle(c.caseNo)} className="h-4 w-4 accent-brand" aria-label={`Select ${c.title}`} />
              </td>
              <td className="px-3 py-3">
                <Link href={`/cases/${c.id}`} className="font-semibold hover:text-brand">{c.title}</Link>
                <p className="text-xs text-slate-500">{c.subtitle}</p>
              </td>
              <td className="px-3 py-3 text-slate-500">{c.caseNo}</td>
              <td className="px-3 py-3 text-slate-500">{c.client}</td>
              <td className="px-3 py-3"><Badge className={caseTypeStyles[c.type]}>{c.type}</Badge></td>
              <td className="px-3 py-3"><Badge className={statusStyles[c.status]}>{c.status}</Badge></td>
              <td className="px-3 py-3"><HearingCell c={c} /></td>
              <td className="px-3 py-3 text-xs leading-tight text-slate-600">
                <p>{formatDate(c.updated)}</p>
                <p className="text-slate-400">by You</p>
              </td>
              <td className="px-3 py-3">
                <div className="flex items-center justify-center gap-2">
                  <Link href={`/cases/${c.id}`} aria-label="View" className="rounded-md p-2 text-slate-700 hover:bg-slate-100"><Eye size={17} /></Link>
                  <button onClick={() => act.editCase(c)} aria-label="Edit" className="rounded-md p-2 text-slate-700 hover:bg-slate-100"><Pencil size={17} /></button>
                  <RowMenu items={caseMenu(c, act, router)} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
