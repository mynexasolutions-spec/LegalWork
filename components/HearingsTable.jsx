import { FiMoreVertical } from "react-icons/fi";
import SectionCard from "./SectionCard";
import Badge from "./Badge";
import { hearings, caseTypeStyles } from "@/lib/data";

export default function HearingsTable() {
  return (
    <SectionCard title="Upcoming Hearings" href="/hearings" className="h-full">
      <div className="overflow-x-auto">
        <table className="w-full min-w-150 text-left text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-600">
              <th className="rounded-l-lg px-3 py-2.5 font-medium">Date</th>
              <th className="px-3 py-2.5 font-medium">Time</th>
              <th className="px-3 py-2.5 font-medium">Case Title</th>
              <th className="px-3 py-2.5 font-medium">Court</th>
              <th className="px-3 py-2.5 font-medium">Type</th>
              <th className="rounded-r-lg px-3 py-2.5 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {hearings.map((h) => (
              <tr key={h.caseNo}>
                <td className="px-3 py-3">
                  <div className="flex h-12 w-12 flex-col items-center justify-center rounded-lg bg-red-50 leading-tight">
                    <span className="text-lg font-bold text-red-600">{h.day}</span>
                    <span className="text-xs text-red-500">{h.month}</span>
                  </div>
                </td>
                <td className="px-3 py-3 text-slate-600">{h.time}</td>
                <td className="px-3 py-3">
                  <p className="font-semibold">{h.title}</p>
                  <p className="text-xs text-slate-500">{h.caseNo}</p>
                </td>
                <td className="px-3 py-3 text-slate-600">{h.court}</td>
                <td className="px-3 py-3">
                  <Badge className={caseTypeStyles[h.type]}>{h.type}</Badge>
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-3">
                    <button className="rounded-md border border-slate-200 px-5 py-1.5 text-xs font-medium hover:bg-slate-50">
                      View
                    </button>
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
