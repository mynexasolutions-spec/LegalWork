"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Folder, CheckCircle2, CalendarDays, CalendarClock, FileText, User, Check, Eye, Pencil, Bell, XCircle, RotateCcw, Trash2 } from "lucide-react";
import { FaBalanceScale } from "react-icons/fa";
import StatCard from "@/components/StatCard";
import DashboardInsights from "@/components/DashboardInsights";
import Badge from "@/components/Badge";
import RowMenu from "@/components/ui/RowMenu";
import { useStore, daysFrom } from "@/lib/store";
import { useActions } from "@/components/ui/ActionsProvider";
import { useToast } from "@/components/ui/Toast";
import { caseTypeStyles, statusStyles } from "@/lib/data";
import { formatDate, caseSlug } from "@/lib/cases";

const monthShort = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const iconFor = { calendar: CalendarDays, doc: FileText, upload: FileText, users: User, check: FileText, phone: User, card: FileText, file: FileText };

function Card({ title, href, className = "", children }) {
  return (
    <section className={`lift rounded-xl border border-line bg-white p-5 shadow-sm ${className}`}>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold">{title}</h2>
        <Link href={href} className="group flex items-center gap-1.5 text-sm font-medium text-slate-700 hover:text-brand">
          View All
        </Link>
      </div>
      {children}
    </section>
  );
}

export default function DashboardView() {
  const s = useStore();
  const act = useActions();
  const toast = useToast();
  const router = useRouter();
  const [greeting, setGreeting] = useState("Welcome");
  const [filters, setFilters] = useState({ type: null, status: null });

  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Good Morning" : h < 17 ? "Good Afternoon" : "Good Evening");
  }, []);

  const count = (st) => s.cases.filter((c) => c.status === st).length;
  const upcoming = s.hearings
    .filter((h) => h.status === "Scheduled" && h.date >= s.today)
    .sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  const nextWeek = upcoming.filter((h) => daysFrom(s.today, h.date) <= 7).length;
  const pendingReminders = s.reminders
    .filter((r) => !r.completed)
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 4);
  const recent = [...s.cases]
    .filter((c) => (!filters.type || c.type === filters.type) && (!filters.status || c.status === filters.status))
    .sort((a, b) => b.updated.localeCompare(a.updated))
    .slice(0, 5);

  const relTag = (date) => {
    const d = daysFrom(s.today, date);
    return d < 0 ? "Overdue" : d === 0 ? "Today" : d === 1 ? "Tomorrow" : `${String(Number(date.slice(8)))} ${monthShort[Number(date.slice(5, 7)) - 1]}`;
  };

  return (
    <div className="mx-auto flex max-w-350 flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">{greeting}, Harsh</h1>
          <p className="mt-1 text-slate-600">Here&apos;s a quick overview of your legal cases.</p>
        </div>
        <button onClick={() => act.addCase()} className="flex items-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-brand-dark hover:shadow-md">
          <Plus size={18} /> Upload Case File
        </button>
      </div>

      <div className="stagger grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4">
        <Link href="/cases" className="block h-full"><StatCard label="Total Cases" value={s.cases.length} iconBg="bg-orange-100 text-orange-500" icon={<Folder size={30} strokeWidth={1.5} />} /></Link>
        <Link href="/active-cases" className="block h-full"><StatCard label="Active Cases" value={count("Active")} iconBg="bg-emerald-100 text-emerald-600" icon={<FaBalanceScale size={28} />} /></Link>
        <Link href="/closed-cases" className="block h-full"><StatCard label="Closed Cases" value={count("Closed")} iconBg="bg-indigo-100 text-indigo-600" icon={<CheckCircle2 size={30} strokeWidth={1.5} />} /></Link>
        <Link href="/hearings" className="block h-full"><StatCard label="Upcoming Hearings" value={nextWeek} note="Next 7 days" iconBg="bg-red-100 text-red-600" icon={<CalendarDays size={30} strokeWidth={1.5} />} /></Link>
      </div>

      <DashboardInsights filters={filters} setFilters={setFilters} />

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.9fr_1fr]">
        <Card title="Upcoming Hearings" href="/hearings" className="h-full">
          <div className="overflow-x-auto">
            <table className="w-full min-w-150 text-left text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-600">
                  {["Date", "Time", "Case Title", "Court", "Type", "Actions"].map((h, i, a) => (
                    <th key={h} className={`px-3 py-2.5 font-medium ${i === 0 ? "rounded-l-lg" : ""} ${i === a.length - 1 ? "rounded-r-lg" : ""}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {upcoming.length === 0 && <tr><td colSpan={6} className="py-10 text-center text-slate-500">No upcoming hearings. <button onClick={() => act.addHearing()} className="font-medium text-brand">Schedule one</button></td></tr>}
                {upcoming.slice(0, 3).map((h) => {
                  const c = s.cases.find((x) => x.caseNo === h.caseNo);
                  return (
                    <tr key={h.id}>
                      <td className="px-3 py-3">
                        <div className="flex h-12 w-12 flex-col items-center justify-center rounded-lg bg-red-50 leading-tight">
                          <span className="text-lg font-bold text-red-600">{h.date.slice(8)}</span>
                          <span className="text-xs text-red-500">{monthShort[Number(h.date.slice(5, 7)) - 1]}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-slate-600">{h.time}</td>
                      <td className="px-3 py-3">
                        <Link href={`/cases/${caseSlug(h.caseNo)}`} className="font-semibold hover:text-brand">{c?.title ?? h.caseNo}</Link>
                        <p className="text-xs text-slate-500">{h.caseNo}</p>
                      </td>
                      <td className="px-3 py-3 text-slate-600">{h.court}</td>
                      <td className="px-3 py-3">{c && <Badge className={caseTypeStyles[c.type]}>{c.type}</Badge>}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-3">
                          <Link href={`/cases/${caseSlug(h.caseNo)}`} className="rounded-md border border-slate-200 px-5 py-1.5 text-xs font-medium hover:bg-slate-50">View</Link>
                          <RowMenu
                            items={[
                              { label: "Mark completed", icon: Check, onClick: () => act.completeHearing(h) },
                              { label: "Reschedule", icon: Pencil, onClick: () => act.editHearing(h) },
                              { label: "Add reminder", icon: Bell, onClick: () => act.addReminder({ title: `Hearing: ${h.purpose}`, caseNo: h.caseNo, date: h.date, type: "Hearing", priority: "High" }) },
                              { label: "Delete hearing", icon: Trash2, danger: true, divider: true, onClick: () => act.deleteHearing(h) },
                            ]}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Reminders" href="/reminders" className="h-full">
          <ul className="flex flex-col gap-4">
            {pendingReminders.length === 0 && <li className="py-6 text-center text-sm text-slate-500">No pending reminders.</li>}
            {pendingReminders.map((r) => {
              const Icon = iconFor[r.icon] ?? FileText;
              const overdue = daysFrom(s.today, r.date) < 0;
              return (
                <li key={r.id} className="group flex items-center gap-3">
                  <button
                    onClick={() => { s.completeReminders([r.id]); toast("Reminder completed"); }}
                    aria-label={`Complete ${r.title}`}
                    title="Mark as done"
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg transition group-hover:bg-emerald-50 group-hover:text-emerald-600 ${overdue ? "bg-red-50 text-red-600" : "bg-orange-50 text-orange-500"}`}
                  >
                    <Icon size={20} strokeWidth={1.75} className="group-hover:hidden" />
                    <Check size={20} className="hidden group-hover:block" />
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{r.title}</p>
                    <p className="truncate text-xs text-slate-500">{r.caseNo ? s.caseTitle(r.caseNo) : r.note}</p>
                  </div>
                  <span className={`shrink-0 rounded-md px-2.5 py-1 text-xs ${overdue ? "bg-red-50 text-red-600" : daysFrom(s.today, r.date) <= 1 ? "bg-sky-50 text-sky-600" : "bg-slate-100 text-slate-600"}`}>{relTag(r.date)}</span>
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <Card title="Recent Cases" href="/cases">
        <div className="overflow-x-auto">
          <table className="w-full min-w-175 text-left text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600">
                {["Case Title", "Case No.", "Client", "Type", "Status", "Next Hearing", "Actions"].map((h, i, a) => (
                  <th key={h} className={`px-3 py-2.5 font-medium ${i === 0 ? "rounded-l-lg" : ""} ${i === a.length - 1 ? "rounded-r-lg" : ""}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {recent.length === 0 && <tr><td colSpan={7} className="py-10 text-center text-slate-500">{filters.type || filters.status ? <>No cases match this filter. <button onClick={() => setFilters({ type: null, status: null })} className="font-medium text-brand">Clear filter</button></> : "No cases yet."}</td></tr>}
              {recent.map((c) => (
                <tr key={c.id}>
                  <td className="px-3 py-3 font-semibold"><Link href={`/cases/${c.id}`} className="hover:text-brand">{c.title}</Link></td>
                  <td className="px-3 py-3 text-slate-500">{c.caseNo}</td>
                  <td className="px-3 py-3 text-slate-500">{c.client}</td>
                  <td className="px-3 py-3"><Badge className={caseTypeStyles[c.type]}>{c.type}</Badge></td>
                  <td className="px-3 py-3"><Badge className={statusStyles[c.status]}>{c.status}</Badge></td>
                  <td className="px-3 py-3 text-slate-500">{c.hearingDate ? formatDate(c.hearingDate) : "-"}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      <Link href={`/cases/${c.id}`} className="rounded-md border border-slate-200 px-5 py-1.5 text-xs font-medium hover:bg-slate-50">View</Link>
                      <RowMenu
                        items={[
                          { label: "View case", icon: Eye, onClick: () => router.push(`/cases/${c.id}`) },
                          { label: "Edit case", icon: Pencil, onClick: () => act.editCase(c) },
                          { label: "Add hearing", icon: CalendarClock, hidden: c.status === "Closed", onClick: () => act.addHearing({ caseNo: c.caseNo }) },
                          { label: "Close case", icon: XCircle, hidden: c.status === "Closed", onClick: () => act.closeCase(c) },
                          { label: "Reopen case", icon: RotateCcw, hidden: c.status !== "Closed", onClick: () => act.reopenCase(c) },
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
      </Card>
    </div>
  );
}
