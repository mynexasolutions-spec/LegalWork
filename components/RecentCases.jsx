import Link from "next/link";
import { FiMoreVertical } from "react-icons/fi";
import { caseSlug } from "@/lib/cases";
import SectionCard from "./SectionCard";
import Badge from "./Badge";
import { recentCases, caseTypeStyles, statusStyles } from "@/lib/data";

export default function RecentCases() {
  return (
    <SectionCard title="Recent Cases" href="/cases">
      <div className="overflow-x-auto">
        <table className="w-full min-w-175 text-left text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-600">
              <th className="rounded-l-lg px-3 py-2.5 font-medium">Case Title</th>
              <th className="px-3 py-2.5 font-medium">Case No.</th>
              <th className="px-3 py-2.5 font-medium">Client</th>
              <th className="px-3 py-2.5 font-medium">Type</th>
              <th className="px-3 py-2.5 font-medium">Status</th>
              <th className="px-3 py-2.5 font-medium">Next Hearing</th>
              <th className="rounded-r-lg px-3 py-2.5 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {recentCases.map((c) => (
              <tr key={c.caseNo}>
                <td className="px-3 py-3 font-semibold">{c.title}</td>
                <td className="px-3 py-3 text-slate-500">{c.caseNo}</td>
                <td className="px-3 py-3 text-slate-500">{c.client}</td>
                <td className="px-3 py-3">
                  <Badge className={caseTypeStyles[c.type]}>{c.type}</Badge>
                </td>
                <td className="px-3 py-3">
                  <Badge className={statusStyles[c.status]}>{c.status}</Badge>
                </td>
                <td className="px-3 py-3 text-slate-500">{c.next}</td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/cases/${caseSlug(c.caseNo)}`}
                      className="rounded-md border border-slate-200 px-5 py-1.5 text-xs font-medium hover:bg-slate-50"
                    >
                      View
                    </Link>
                    <button aria-label="More" className="text-slate-600">
                      <FiMoreVertical size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
