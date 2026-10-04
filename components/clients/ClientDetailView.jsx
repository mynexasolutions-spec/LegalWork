"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRight, Pencil, User, Phone, Mail, MapPin, Briefcase, Calendar, Users, IdCard, Plus, FileText, StickyNote, Upload, Send, FolderPlus, Trash2, Download, Power, FolderOpen, Files,
} from "lucide-react";
import Avatar from "@/components/Avatar";
import Badge from "@/components/Badge";
import CountUp from "@/components/ui/CountUp";
import { useStore } from "@/lib/store";
import { useActions } from "@/components/ui/ActionsProvider";
import { useToast } from "@/components/ui/Toast";
import { caseTypeStyles, statusStyles } from "@/lib/data";
import { formatDate } from "@/lib/cases";
import { formatSize } from "@/lib/format";

const statusStyle = { Active: "bg-emerald-50 text-emerald-600", Inactive: "bg-red-50 text-red-600" };
const outline = "flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-medium hover:bg-slate-50";

const Card = ({ title, action, children, className = "" }) => (
  <section className={`rounded-xl border border-line bg-white p-5 shadow-sm ${className}`}>
    <div className="mb-4 flex items-center justify-between gap-3"><h2 className="text-lg font-bold">{title}</h2>{action}</div>
    {children}
  </section>
);
const SmallBtn = ({ icon: Icon, children, ...p }) => (
  <button {...p} className="flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-xs font-medium hover:bg-slate-50">{Icon && <Icon size={13} />} {children}</button>
);

function Rows({ rows }) {
  return (
    <dl className="space-y-3.5 text-sm">
      {rows.map(([Icon, k, v]) => (
        <div key={k} className="grid grid-cols-[22px_110px_1fr] items-start gap-2"><Icon size={16} className="mt-0.5 text-slate-500" /><dt className="text-slate-500">{k}</dt><dd className="break-words">{v || "-"}</dd></div>
      ))}
    </dl>
  );
}

export default function ClientDetailView({ id }) {
  const s = useStore();
  const act = useActions();
  const toast = useToast();
  const router = useRouter();
  const c = s.clients.find((x) => x.id === id);

  useEffect(() => { document.title = c ? `${c.name} - LexPro` : "Client not found - LexPro"; }, [c]);

  if (!c) {
    return (
      <div className="mx-auto max-w-3xl pt-10">
        <div className="flex flex-col items-center gap-3 rounded-xl border border-line bg-white py-16 text-slate-500 shadow-sm">
          <Users size={32} strokeWidth={1.5} />
          <p className="text-sm">This client doesn&apos;t exist (it may have been deleted).</p>
          <Link href="/clients" className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white">Back to Clients</Link>
        </div>
      </div>
    );
  }

  const cases = s.cases.filter((x) => x.client.toLowerCase() === c.name.toLowerCase());
  const docs = s.documents.filter((d) => !d.trashed && cases.some((x) => x.caseNo === d.caseNo)).sort((a, b) => b.ts.localeCompare(a.ts));
  const notes = s.notes[`client:${c.id}`] ?? [];
  const noteKey = { key: `client:${c.id}`, title: c.name };

  const tiles = [
    [Briefcase, "Total cases", Math.max(c.totalCases, cases.length), "bg-blue-100 text-blue-600"],
    [FolderOpen, "Active cases", Math.max(c.activeCases, cases.filter((x) => x.status === "Active").length), "bg-emerald-100 text-emerald-600"],
    [Files, "Documents", docs.length, "bg-purple-100 text-purple-600"],
    [StickyNote, "Notes", notes.length, "bg-amber-100 text-amber-600"],
  ];
  const actions = [
    [FolderPlus, "Add Case", "bg-emerald-50 text-emerald-600", () => act.addCase({ client: c.name })],
    [StickyNote, "Add Note", "bg-blue-50 text-blue-600", () => act.addNote(noteKey)],
    [Upload, "Upload Doc", "bg-purple-50 text-purple-600", () => act.upload(cases[0] ? { caseNo: cases[0].caseNo } : {})],
    [Send, "Send Email", "bg-orange-50 text-orange-500", () => act.emailClient(c)],
  ];

  return (
    <div className="mx-auto flex max-w-350 flex-col gap-5">
      <nav className="flex items-center gap-2 text-sm text-slate-600">
        <Link href="/clients" className="hover:text-brand">Clients</Link><ChevronRight size={14} /><span className="text-ink">{c.name}</span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar name={c.name} corporate={c.type === "Corporate"} size="h-16 w-16" text="text-xl" />
          <div>
            <div className="flex flex-wrap items-center gap-3"><h1 className="text-3xl font-bold">{c.name}</h1><Badge className={statusStyle[c.status]}>{c.status}</Badge></div>
            <p className="text-sm text-slate-600">{c.type} client &bull; {c.city || "No city"} &bull; client since {formatDate(c.added)}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => act.toggleClientStatus(c)} className={outline}><Power size={16} /> Mark {c.status === "Active" ? "inactive" : "active"}</button>
          <button onClick={() => act.editClient(c)} className={outline}><Pencil size={16} /> Edit</button>
          <button onClick={() => act.deleteClient(c, () => router.push("/clients"))} className={`${outline} text-red-600 hover:bg-red-50`}><Trash2 size={16} /> Delete</button>
          <button onClick={() => act.addCase({ client: c.name })} className="flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"><Plus size={16} /> Add Case</button>
        </div>
      </div>

      <div className="stagger grid grid-cols-2 gap-4 xl:grid-cols-4">
        {tiles.map(([Icon, label, value, tint]) => (
          <div key={label} className="lift flex items-center gap-4 rounded-xl border border-line bg-white p-4 shadow-sm">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${tint}`}><Icon size={22} strokeWidth={1.6} /></div>
            <div><p className="text-xs text-slate-500">{label}</p><p className="text-2xl font-bold leading-tight"><CountUp value={value} /></p></div>
          </div>
        ))}
      </div>

      <div className="stagger grid grid-cols-1 gap-5 lg:grid-cols-3">
        <Card title="Contact Information" action={<SmallBtn icon={Pencil} onClick={() => act.editClient(c)}>Edit</SmallBtn>}>
          <Rows rows={[[User, "Full Name", c.name], [Phone, "Phone Number", c.phone], [Mail, "Email Address", c.email], [MapPin, "Address", c.address]]} />
        </Card>
        <Card title="Client Details" action={<SmallBtn icon={Pencil} onClick={() => act.editClient(c)}>Edit</SmallBtn>}>
          <Rows rows={[[Briefcase, "Client Type", c.type], [Calendar, "Date Added", formatDate(c.added)], [Users, "Referred By", c.referredBy], [IdCard, "Identity Proof", c.identity]]} />
        </Card>
        <Card title="Quick Actions">
          <div className="grid grid-cols-2 gap-3">
            {actions.map(([Icon, label, tint, run]) => (
              <button key={label} onClick={run} className={`lift flex flex-col items-center gap-2 rounded-xl px-2 py-5 text-sm font-medium ${tint}`}><Icon size={24} /> {label}</button>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.6fr_1fr]">
        <Card title={`Cases (${cases.length})`} action={<SmallBtn icon={Plus} onClick={() => act.addCase({ client: c.name })}>Add Case</SmallBtn>}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-120 text-left text-sm">
              <thead><tr className="bg-slate-50 text-slate-600">{["Case", "Type", "Status", "Next Hearing"].map((h) => <th key={h} className="px-3 py-2.5 font-medium">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-line">
                {cases.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-slate-500">No cases linked to this client yet.</td></tr>}
                {cases.map((x) => (
                  <tr key={x.id}>
                    <td className="px-3 py-3"><Link href={`/cases/${x.id}`} className="font-semibold hover:text-brand">{x.title}</Link><p className="text-xs text-slate-500">{x.caseNo}</p></td>
                    <td className="px-3 py-3"><Badge className={caseTypeStyles[x.type]}>{x.type}</Badge></td>
                    <td className="px-3 py-3"><Badge className={statusStyles[x.status]}>{x.status}</Badge></td>
                    <td className="px-3 py-3 text-slate-600">{x.hearingDate ? formatDate(x.hearingDate) : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title={`Notes (${notes.length})`} action={<SmallBtn icon={Plus} onClick={() => act.addNote(noteKey)}>Add Note</SmallBtn>}>
          {notes.length === 0 && <p className="py-6 text-center text-sm text-slate-500">No notes yet.</p>}
          <ul className="space-y-3">
            {[...notes].reverse().map((n) => (
              <li key={n.id} className="group flex items-start gap-3">
                <Avatar name={n.by} size="h-9 w-9" text="text-xs" />
                <div className="flex-1 text-sm leading-snug"><p>{n.text}</p><p className="text-xs text-slate-500">{n.by} &bull; {n.at}</p></div>
                <button onClick={() => { s.deleteNote(`client:${c.id}`, n.id); toast("Note deleted"); }} aria-label="Delete note" className="text-slate-300 opacity-0 transition hover:text-red-500 group-hover:opacity-100"><Trash2 size={14} /></button>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Card title={`Documents (${docs.length})`} action={<SmallBtn icon={Upload} onClick={() => act.upload(cases[0] ? { caseNo: cases[0].caseNo } : {})}>Upload</SmallBtn>}>
        <ul className="divide-y divide-line text-sm">
          {docs.length === 0 && <li className="py-8 text-center text-slate-500">No documents on this client&apos;s cases.</li>}
          {docs.slice(0, 8).map((d) => (
            <li key={d.id} className="flex items-center gap-3 py-3">
              <FileText size={18} className={d.kind === "pdf" ? "text-red-500" : "text-blue-500"} />
              <Link href={`/documents/${d.id}`} className="min-w-0 flex-1 truncate font-medium hover:text-brand">{d.name}</Link>
              <span className="hidden text-xs text-slate-500 sm:block">{d.type} &bull; {formatSize(d.sizeKb)} &bull; {formatDate(d.date)}</span>
              <button onClick={() => act.downloadDoc(d)} aria-label={`Download ${d.name}`} className="rounded-md border border-line p-1.5 hover:bg-slate-50"><Download size={14} /></button>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
