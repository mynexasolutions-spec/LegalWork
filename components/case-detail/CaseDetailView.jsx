"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRight, House, Calendar, CalendarPlus, StickyNote, Pencil, Paperclip, Clock, Sparkles, FileText, FileArchive, Hash, Landmark,
  User, UserRound, Phone, Bell, Plus, Download, ChevronUp, Check, X, XCircle, RotateCcw, Trash2, Share2, Eye, FolderOpen,
} from "lucide-react";
import Badge from "@/components/Badge";
import RowMenu from "@/components/ui/RowMenu";
import { useStore, daysFrom } from "@/lib/store";
import { useActions } from "@/components/ui/ActionsProvider";
import { useToast } from "@/components/ui/Toast";
import { caseTypeStyles, statusStyles } from "@/lib/data";
import { formatDate } from "@/lib/cases";
import { formatSize } from "@/lib/format";
import { analysisFor } from "@/lib/aiData";
import { resultStyles } from "@/lib/closedCases";

const TABS = [
  { id: "overview", label: "Overview", icon: House },
  { id: "hearings", label: "Hearings", icon: Calendar },
  { id: "documents", label: "Documents", icon: FileText },
  { id: "timeline", label: "Timeline", icon: Clock },
  { id: "ai", label: "AI Analysis", icon: Sparkles },
  { id: "notes", label: "Notes", icon: StickyNote },
];

const partyStyle = {
  person: { Icon: User, bg: "bg-orange-100 text-orange-500" },
  govt: { Icon: Landmark, bg: "bg-indigo-100 text-indigo-600" },
  officer: { Icon: UserRound, bg: "bg-emerald-100 text-emerald-600" },
};

const hearingBadge = {
  Upcoming: "bg-amber-100 text-amber-700",
  Overdue: "bg-red-100 text-red-600",
  Completed: "bg-emerald-50 text-emerald-600",
  Cancelled: "bg-slate-100 text-slate-500",
};

const outline = "flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-medium hover:bg-slate-50";

function Card({ title, action, children, className = "" }) {
  return (
    <section className={`rounded-xl border border-line bg-white p-5 shadow-sm ${className}`}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-bold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

const SmallBtn = ({ icon: Icon, children, className = "", ...rest }) => (
  <button {...rest} className={`flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-xs font-medium hover:bg-slate-50 ${className}`}>
    {Icon && <Icon size={13} />} {children}
  </button>
);

function Empty({ icon: Icon, text, action }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-line bg-white py-16 text-slate-500 shadow-sm">
      <Icon size={32} strokeWidth={1.5} />
      <p className="text-sm">{text}</p>
      {action}
    </div>
  );
}

export default function CaseDetailView({ slug }) {
  const s = useStore();
  const act = useActions();
  const toast = useToast();
  const router = useRouter();
  const [tab, setTab] = useState("overview");
  const [showAllHearings, setShowAllHearings] = useState(true);
  const c = s.cases.find((x) => x.id === slug);

  useEffect(() => {
    document.title = c ? `${c.title} - LexPro` : "Case not found - LexPro";
  }, [c]);

  const hearings = useMemo(() => (c ? s.hearings.filter((h) => h.caseNo === c.caseNo).sort((a, b) => b.date.localeCompare(a.date)) : []), [s.hearings, c]);
  const docs = useMemo(() => (c ? s.documents.filter((d) => d.caseNo === c.caseNo && !d.trashed).sort((a, b) => b.ts.localeCompare(a.ts)) : []), [s.documents, c]);

  if (!c) {
    return (
      <div className="mx-auto max-w-3xl pt-10">
        <Empty icon={FolderOpen} text="This case doesn't exist (it may have been deleted)." action={<Link href="/cases" className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white">Back to My Cases</Link>} />
      </div>
    );
  }

  const notes = s.notes[`case:${c.caseNo}`] ?? [];
  const closed = c.status === "Closed";
  const status = (h) => (h.status === "Scheduled" ? (h.date < s.today ? "Overdue" : "Upcoming") : h.status);
  const next = hearings.filter((h) => h.status === "Scheduled" && h.date >= s.today).sort((a, b) => a.date.localeCompare(b.date))[0];
  const lastDone = hearings.find((h) => h.status === "Completed");
  const daysLeft = next ? daysFrom(s.today, next.date) : null;
  const badge = daysLeft === null ? "" : daysLeft === 0 ? "Today" : daysLeft === 1 ? "Tomorrow" : `${daysLeft} Days Left`;

  const keyDates = [
    { id: "filed", label: "Filing Date", value: formatDate(c.filed), tone: "bg-emerald-500" },
    ...[...c.extraDates].sort((a, b) => a.date.localeCompare(b.date)).map((d) => ({ id: d.id, label: d.label, value: formatDate(d.date), tone: "bg-emerald-500", removable: true })),
    ...(lastDone ? [{ id: "last", label: "Last Hearing", value: formatDate(lastDone.date), tone: "bg-slate-400" }] : []),
    ...(next ? [{ id: "next", label: "Next Hearing", value: `${formatDate(next.date)}, ${next.time}`, tone: "bg-red-500" }] : []),
    ...(closed && c.closedDate ? [{ id: "closed", label: "Closed On", value: formatDate(c.closedDate), tone: "bg-indigo-500" }] : []),
  ];

  const timeline = [
    { id: "filed", date: c.filed, title: "Case filed", sub: `${c.caseNo} registered at ${c.court}`, icon: FolderOpen },
    ...hearings.map((h) => ({ id: h.id, date: h.date, title: `Hearing: ${h.purpose}`, sub: `${status(h)} - ${h.time}${h.remarks ? ` - ${h.remarks}` : ""}`, icon: Calendar })),
    ...docs.map((d) => ({ id: d.id, date: d.date, title: `Document uploaded: ${d.name}`, sub: `${d.type} by ${d.by}`, icon: FileText })),
    ...notes.filter((n) => n.ts).map((n) => ({ id: n.id, date: n.ts.slice(0, 10), title: "Note added", sub: n.text, icon: StickyNote })),
    ...(closed && c.closedDate ? [{ id: "closed", date: c.closedDate, title: `Case closed (${c.result})`, sub: "", icon: XCircle }] : []),
  ].sort((a, b) => b.date.localeCompare(a.date));

  const call = (p) => (p.phone ? (window.location.href = `tel:${p.phone.replace(/\s/g, "")}`) : toast(`No phone number saved for ${p.name}`, "info"));

  const menu = [
    { label: "Close case", icon: XCircle, hidden: closed, onClick: () => act.closeCase(c) },
    { label: "Reopen case", icon: RotateCcw, hidden: !closed, onClick: () => act.reopenCase(c) },
    { label: "Delete case", icon: Trash2, danger: true, divider: !closed, onClick: () => act.deleteCase(c, () => router.push("/cases")) },
  ];

  const docMenu = (d) => [
    { label: "Open", icon: Eye, onClick: () => router.push(`/documents/${d.id}`) },
    { label: "Rename", icon: Pencil, onClick: () => act.renameDoc(d) },
    { label: "Share link", icon: Share2, onClick: () => act.shareDoc(d) },
    { label: "Move to Trash", icon: Trash2, danger: true, divider: true, onClick: () => act.trashDocs([d.id]) },
  ];

  const hearingMenu = (h) => [
    { label: "Mark completed", icon: Check, hidden: h.status !== "Scheduled", onClick: () => act.completeHearing(h) },
    { label: "Edit hearing", icon: Pencil, onClick: () => act.editHearing(h) },
    { label: "Delete hearing", icon: Trash2, danger: true, divider: true, onClick: () => act.deleteHearing(h) },
  ];

  const info = [
    ["Case Title", c.title], ["Case No.", c.caseNo], ["FIR No.", c.firNo], ["Case Type", c.type], ["Court", c.court],
    ["Filing Date", formatDate(c.filed)], ["Sections", c.sections],
    ["Status", <span key="s" className="flex items-center gap-2"><Badge className={statusStyles[c.status]}>{c.status}</Badge>{closed && c.result && <Badge className={resultStyles[c.result] ?? "bg-slate-100 text-slate-600"}>{c.result}</Badge>}</span>],
    ["Description", c.description],
  ];

  const HearingsTable = ({ collapsible }) => (
    <Card
      title={collapsible ? "Recent Hearings" : "All Hearings"}
      action={
        <div className="flex items-center gap-3">
          {collapsible && (
            <button onClick={() => setShowAllHearings(!showAllHearings)} className="flex items-center gap-1 text-sm font-medium text-brand">
              {showAllHearings ? "Hide" : "Show"} <ChevronUp size={15} className={showAllHearings ? "" : "rotate-180"} />
            </button>
          )}
          {!closed && <SmallBtn icon={CalendarPlus} onClick={() => act.addHearing({ caseNo: c.caseNo })}>Add Hearing</SmallBtn>}
        </div>
      }
    >
      {(!collapsible || showAllHearings) && (
        <div className="overflow-x-auto">
          <table className="w-full min-w-175 text-left text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-600">
                {["#", "Date", "Time", "Court", "Purpose", "Status", "Order / Remarks", "Actions"].map((h) => <th key={h} className="px-3 py-2.5 font-medium">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {hearings.length === 0 && <tr><td colSpan={8} className="py-8 text-center text-slate-500">No hearings recorded.</td></tr>}
              {(collapsible ? hearings.slice(0, 5) : hearings).map((h, i) => (
                <tr key={h.id}>
                  <td className="px-3 py-3">{i + 1}</td>
                  <td className="px-3 py-3 text-slate-600">{formatDate(h.date)}</td>
                  <td className="px-3 py-3 text-slate-600">{h.time}</td>
                  <td className="px-3 py-3 text-slate-600">{h.court}</td>
                  <td className="px-3 py-3 text-slate-600">{h.purpose}</td>
                  <td className="px-3 py-3"><Badge className={hearingBadge[status(h)]}>{status(h)}</Badge></td>
                  <td className="max-w-48 truncate px-3 py-3 text-slate-600">{h.remarks || "-"}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-3">
                      <SmallBtn className="px-5" onClick={() => act.viewHearing(h)}>View</SmallBtn>
                      <RowMenu items={hearingMenu(h)} className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100" />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );

  const Documents = () => (
    <Card
      title="Latest Documents"
      action={
        <div className="flex items-center gap-4">
          <Link href="/documents" className="text-sm font-medium text-indigo-600">View All</Link>
          <button onClick={() => act.upload({ caseNo: c.caseNo })} className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"><Paperclip size={15} /> Upload</button>
        </div>
      }
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-125 text-left text-sm">
          <thead>
            <tr className="bg-slate-50 text-slate-600">{["Name", "Type", "Uploaded On", "Uploaded By", "Size", "Actions"].map((h) => <th key={h} className="px-3 py-2.5 font-medium">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-line">
            {docs.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-slate-500">No documents yet. Upload the first one.</td></tr>}
            {docs.slice(0, tab === "documents" ? 50 : 5).map((d) => (
              <tr key={d.id}>
                <td className="px-3 py-3">
                  <Link href={`/documents/${d.id}`} className="flex items-center gap-3 font-medium hover:text-brand">
                    {d.kind === "pdf" ? <FileText size={22} className="text-red-500" /> : d.kind === "zip" ? <FileArchive size={22} className="text-amber-500" /> : <FileText size={22} className="text-blue-500" />}
                    <span className="max-w-44 truncate">{d.name}</span>
                  </Link>
                </td>
                <td className="px-3 py-3 text-slate-500">{d.type}</td>
                <td className="px-3 py-3 text-slate-500">{formatDate(d.date)}</td>
                <td className="px-3 py-3 text-slate-500">{d.by}</td>
                <td className="px-3 py-3 text-slate-500">{formatSize(d.sizeKb)}</td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => act.downloadDoc(d)} aria-label={`Download ${d.name}`} className="rounded-md border border-line px-3 py-1.5 hover:bg-slate-50"><Download size={15} /></button>
                    <RowMenu items={docMenu(d)} className="rounded-md p-1.5 text-slate-600 hover:bg-slate-100" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );

  const AiCard = () => (
    <Card
      title="AI Analysis"
      action={<button onClick={() => router.push("/ai-analysis")} className="flex items-center gap-2 rounded-lg bg-indigo-50 px-4 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-100"><Sparkles size={15} /> Generate Analysis</button>}
    >
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">Similar cases</p>
      <ul className="divide-y divide-line">
        {analysisFor(c, hearings, docs).similar.slice(0, 3).map((x, i) => (
          <li key={x.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3 sm:flex-nowrap">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-medium">{i + 1}</span>
            <div className="min-w-0 flex-1 text-sm leading-snug sm:w-56 sm:flex-none sm:shrink-0"><p className="font-semibold">{x.title}</p><p className="text-slate-500">{x.cite}</p></div>
            <p className="hidden flex-1 text-sm text-slate-600 md:block">{x.excerpt.slice(0, 90)}...</p>
            <SmallBtn className="ml-auto px-5 py-2" onClick={() => router.push("/ai-analysis")}>View</SmallBtn>
          </li>
        ))}
      </ul>
    </Card>
  );

  const NotesBlock = () => (
    <Card title="Case Notes" action={<SmallBtn icon={Plus} onClick={() => act.addNote({ key: `case:${c.caseNo}`, title: c.title })}>Add Note</SmallBtn>}>
      {notes.length === 0 && <p className="py-8 text-center text-sm text-slate-500">No notes added for this case.</p>}
      <ul className="space-y-3">
        {[...notes].reverse().map((n) => (
          <li key={n.id} className="group flex items-start gap-3 rounded-lg border border-line p-4">
            <StickyNote size={18} className="mt-0.5 shrink-0 text-amber-500" />
            <div className="flex-1 text-sm leading-relaxed"><p>{n.text}</p><p className="mt-1 text-xs text-slate-500">{n.by} &bull; {n.at}</p></div>
            <button onClick={() => { s.deleteNote(`case:${c.caseNo}`, n.id); toast("Note deleted"); }} aria-label="Delete note" className="text-slate-400 opacity-0 transition hover:text-red-500 group-hover:opacity-100"><Trash2 size={15} /></button>
          </li>
        ))}
      </ul>
    </Card>
  );

  return (
    <div className="mx-auto flex max-w-350 flex-col gap-5">
      <nav className="flex items-center gap-2 text-sm text-slate-600">
        <Link href="/cases" className="hover:text-brand">My Cases</Link><ChevronRight size={14} /><span className="text-ink">{c.title}</span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-bold">{c.title}</h1>
            <Badge className={statusStyles[c.status]}>{c.status}</Badge>
            <Badge className={caseTypeStyles[c.type]}>{c.type}</Badge>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm text-slate-600">
            <span className="flex items-center gap-2"><FileText size={16} />{c.caseNo}</span>
            {c.firNo !== "-" && <span className="flex items-center gap-2"><Hash size={16} />{c.firNo}</span>}
            <span className="flex items-center gap-2"><Landmark size={16} />{c.court}</span>
            <span className="flex items-center gap-2"><Calendar size={16} />Filed on {formatDate(c.filed)}</span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <RowMenu items={menu} label="Case options" className="rounded-lg border border-line bg-white p-2.5 text-slate-700 hover:bg-slate-50" />
          <button onClick={() => act.editCase(c)} className={outline}><Pencil size={16} /> Edit Case</button>
          {!closed && <button onClick={() => act.addHearing({ caseNo: c.caseNo })} className={outline}><CalendarPlus size={16} /> Add Hearing</button>}
          <button onClick={() => act.addNote({ key: `case:${c.caseNo}`, title: c.title })} className={outline}><StickyNote size={16} /> Add Note</button>
          <button onClick={() => act.upload({ caseNo: c.caseNo })} className="flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"><Paperclip size={16} /> Upload Document</button>
        </div>
      </div>

      <div className="flex overflow-x-auto rounded-xl border border-line bg-white shadow-sm">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setTab(id)} className={`flex min-w-36 flex-1 items-center justify-center gap-2.5 border-b-2 py-4 text-sm font-medium ${tab === id ? "border-brand text-ink" : "border-transparent text-slate-600 hover:bg-slate-50"}`}>
            <Icon size={18} className={tab === id ? "text-brand" : ""} /> {label}
          </button>
        ))}
      </div>

      <div key={tab} className="anim-fade flex flex-col gap-5">
        {tab === "overview" && (
          <>
            <div className="stagger grid grid-cols-1 gap-5 xl:grid-cols-[1.15fr_1fr_1fr]">
              <Card title="Case Information" action={<SmallBtn icon={Pencil} onClick={() => act.editCase(c)}>Edit</SmallBtn>}>
                <dl className="divide-y divide-line text-sm">
                  {info.map(([k, v]) => (
                    <div key={k} className="grid grid-cols-[110px_1fr] items-center gap-3 py-2.5 first:pt-0"><dt className="text-slate-500">{k}</dt><dd className="leading-relaxed">{v}</dd></div>
                  ))}
                </dl>
              </Card>

              <Card title="Parties Involved" action={<SmallBtn icon={Plus} onClick={() => act.addParty(c)}>Add Party</SmallBtn>}>
                <ul className="divide-y divide-line">
                  {c.parties.length === 0 && <li className="py-6 text-center text-sm text-slate-500">No parties added.</li>}
                  {c.parties.map((p) => {
                    const { Icon, bg } = partyStyle[p.kind] ?? partyStyle.person;
                    return (
                      <li key={p.id} className="group flex items-center gap-3 py-3 first:pt-0">
                        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${bg}`}><Icon size={22} strokeWidth={1.75} /></div>
                        <div className="min-w-0 flex-1 text-sm leading-snug"><p className="font-semibold">{p.role}</p><p className="text-slate-600">{p.name}</p><p className="text-slate-500">{p.note}</p></div>
                        <button onClick={() => { s.removeParty(c.caseNo, p.id); toast("Party removed"); }} aria-label={`Remove ${p.name}`} className="text-slate-300 opacity-0 transition hover:text-red-500 group-hover:opacity-100"><X size={15} /></button>
                        <button onClick={() => call(p)} aria-label={`Call ${p.name}`} className="rounded-md p-2 text-slate-600 hover:bg-slate-100"><Phone size={18} /></button>
                      </li>
                    );
                  })}
                </ul>
              </Card>

              <div className="flex flex-col gap-5">
                <Card title="Next Hearing" action={next && <SmallBtn icon={Check} onClick={() => act.completeHearing(next)}>Mark Completed</SmallBtn>}>
                  {next ? (
                    <div className="rounded-xl bg-red-50/70 p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600"><Calendar size={28} strokeWidth={1.5} /></div>
                        <div className="min-w-0 flex-1 text-sm leading-snug">
                          <p className="text-lg font-bold">{formatDate(next.date)}, {next.time}</p>
                          <p className="text-slate-600">{next.court || c.court}</p>
                          <p className="text-slate-600">Purpose: {next.purpose}</p>
                        </div>
                        <span className="shrink-0 rounded-md bg-red-100 px-3 py-1.5 text-xs font-semibold text-red-600">{badge}</span>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button onClick={() => act.addReminder({ title: `Hearing: ${next.purpose}`, caseNo: c.caseNo, date: next.date, type: "Hearing", priority: "High" })} className="flex items-center gap-2 rounded-md border border-red-300 bg-white px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50"><Bell size={14} /> Add Reminder</button>
                        <button onClick={() => setTab("hearings")} className="flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-xs font-medium hover:bg-slate-50"><FileText size={14} /> View Details</button>
                        <button onClick={() => act.editHearing(next)} className="flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-xs font-medium hover:bg-slate-50"><Pencil size={14} /> Update Hearing</button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-6 text-center text-sm text-slate-500">
                      <p>{closed ? "This case is closed." : "No upcoming hearing scheduled."}</p>
                      {!closed && <button onClick={() => act.addHearing({ caseNo: c.caseNo })} className="mt-3 rounded-md bg-brand px-4 py-2 text-xs font-semibold text-white">Schedule hearing</button>}
                    </div>
                  )}
                </Card>

                <Card title="Key Dates" action={<SmallBtn icon={Plus} onClick={() => act.addKeyDate(c)}>Add Date</SmallBtn>}>
                  <ul className="space-y-3 text-sm">
                    {keyDates.map((d) => (
                      <li key={d.id} className="group grid grid-cols-[14px_130px_1fr_auto] items-center gap-3">
                        <span className={`h-3 w-3 rounded-full ${d.tone}`} />
                        <span className="font-medium">{d.label}</span>
                        <span className="text-slate-600">{d.value}</span>
                        {d.removable ? <button onClick={() => s.removeKeyDate(c.caseNo, d.id)} aria-label={`Remove ${d.label}`} className="text-slate-300 opacity-0 transition hover:text-red-500 group-hover:opacity-100"><X size={14} /></button> : <span />}
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>
            </div>

            {HearingsTable({ collapsible: true })}

            <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_1.15fr]">
              {Documents()}
              {AiCard()}
            </div>
          </>
        )}
        {tab === "hearings" && HearingsTable({})}
        {tab === "documents" && Documents()}
        {tab === "ai" && AiCard()}
        {tab === "notes" && NotesBlock()}
        {tab === "timeline" && (
          <Card title="Case Timeline">
            <ol className="relative ml-3 border-l border-line">
              {timeline.map((e) => {
                const Icon = e.icon;
                return (
                  <li key={e.id} className="mb-6 ml-6 last:mb-0">
                    <span className="absolute -left-3.5 flex h-7 w-7 items-center justify-center rounded-full bg-orange-50 text-brand ring-4 ring-white"><Icon size={14} /></span>
                    <p className="text-sm font-semibold">{e.title}</p>
                    {e.sub && <p className="text-sm text-slate-500">{e.sub}</p>}
                    <p className="text-xs text-slate-400">{formatDate(e.date)}</p>
                  </li>
                );
              })}
            </ol>
          </Card>
        )}
      </div>
    </div>
  );
}
