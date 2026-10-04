"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Calendar, Eye, Pencil } from "lucide-react";
import Badge from "@/components/Badge";
import RowMenu from "@/components/ui/RowMenu";
import { useActions } from "@/components/ui/ActionsProvider";
import { caseMenu } from "./caseMenu";
import { caseTypeStyles, statusStyles } from "@/lib/data";
import { formatDate } from "@/lib/cases";

export default function CasesCards({ cases }) {
  const act = useActions();
  const router = useRouter();

  if (cases.length === 0) {
    return <p className="py-16 text-center text-slate-500">No cases match your filters.</p>;
  }

  return (
    <div className="stagger grid grid-cols-1 gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
      {cases.map((c) => (
        <div key={c.id} className="lift rounded-xl border border-line p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <Link href={`/cases/${c.id}`} className="block truncate font-semibold hover:text-brand">{c.title}</Link>
              <p className="truncate text-xs text-slate-500">{c.subtitle}</p>
            </div>
            <Badge className={statusStyles[c.status]}>{c.status}</Badge>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <Badge className={caseTypeStyles[c.type]}>{c.type}</Badge>
            <span className="text-xs text-slate-500">{c.caseNo}</span>
          </div>
          <dl className="mt-3 space-y-1 text-sm text-slate-600">
            <div className="flex justify-between"><dt>Client</dt><dd className="font-medium text-ink">{c.client}</dd></div>
            <div className="flex justify-between"><dt>Court</dt><dd className="font-medium text-ink">{c.court}</dd></div>
            <div className="flex justify-between">
              <dt>Next hearing</dt>
              <dd className="flex items-center gap-1.5 font-medium text-ink"><Calendar size={14} />{c.hearingDate ? `${formatDate(c.hearingDate)}, ${c.hearingTime}` : "-"}</dd>
            </div>
          </dl>
          <div className="mt-4 flex gap-2">
            <Link href={`/cases/${c.id}`} className="flex flex-1 items-center justify-center gap-2 rounded-md border border-slate-200 py-2 text-xs font-medium hover:bg-slate-50"><Eye size={15} /> View</Link>
            <button onClick={() => act.editCase(c)} className="flex flex-1 items-center justify-center gap-2 rounded-md border border-slate-200 py-2 text-xs font-medium hover:bg-slate-50"><Pencil size={15} /> Edit</button>
            <RowMenu items={caseMenu(c, act, router)} className="rounded-md border border-slate-200 px-2.5 text-slate-700 hover:bg-slate-50" />
          </div>
        </div>
      ))}
    </div>
  );
}
