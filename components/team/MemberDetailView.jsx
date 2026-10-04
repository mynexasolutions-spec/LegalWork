"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronRight, Pencil, User, Mail, Phone, Building2, CalendarDays, UserCog, Eye, FilePlus, CalendarPlus, Upload, Users, BarChart3, Power, Trash2, Plus, X, ShieldCheck, FolderOpen,
} from "lucide-react";
import Avatar from "@/components/Avatar";
import Badge from "@/components/Badge";
import CountUp from "@/components/ui/CountUp";
import FormModal from "@/components/ui/FormModal";
import { useStore } from "@/lib/store";
import { useActions } from "@/components/ui/ActionsProvider";
import { useToast } from "@/components/ui/Toast";
import { caseTypeStyles, statusStyles } from "@/lib/data";
import { formatDate } from "@/lib/cases";
import { roleStyles, allPermissions, activityFor, defaultAssigned } from "@/lib/team";

const permIcon = { "View Cases": Eye, "Edit Cases": Pencil, "Add Hearings": CalendarPlus, "Upload Documents": Upload, "Manage Clients": Users, "Generate Reports": BarChart3, "Manage Team": UserCog };
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

export default function MemberDetailView({ id }) {
  const s = useStore();
  const act = useActions();
  const toast = useToast();
  const router = useRouter();
  const m = s.members.find((x) => x.id === id);

  useEffect(() => { document.title = m ? `${m.name} - LexPro` : "Member not found - LexPro"; }, [m]);

  if (!m) {
    return (
      <div className="mx-auto max-w-3xl pt-10">
        <div className="flex flex-col items-center gap-3 rounded-xl border border-line bg-white py-16 text-slate-500 shadow-sm">
          <Users size={32} strokeWidth={1.5} />
          <p className="text-sm">This team member doesn&apos;t exist (they may have been removed).</p>
          <Link href="/team" className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white">Back to Team</Link>
        </div>
      </div>
    );
  }

  const perms = m.permissions ?? s.roles[m.role] ?? s.roles.Staff ?? [];
  const assignedNos = m.assignedCases ?? defaultAssigned(m, s.cases);
  const assigned = s.cases.filter((c) => assignedNos.includes(c.caseNo));
  const hearings = s.hearings.filter((h) => h.status === "Scheduled" && assignedNos.includes(h.caseNo)).length;
  const docs = s.documents.filter((d) => !d.trashed && assignedNos.includes(d.caseNo)).length;
  const isOwner = m.id === "m0";

  const setPerm = (p) => {
    const next = perms.includes(p) ? perms.filter((x) => x !== p) : [...perms, p];
    s.updateMember(m.id, { permissions: next });
  };
  const assign = () =>
    act.show(
      <FormModal
        size="sm"
        title="Assign case"
        subtitle={m.name}
        submitLabel="Assign"
        onClose={act.close}
        fields={[{ name: "caseNo", label: "Case", type: "select", required: true, options: s.cases.filter((c) => !assignedNos.includes(c.caseNo)).map((c) => ({ value: c.caseNo, label: `${c.title} (${c.caseNo})` })) }]}
        onSubmit={(v) => { s.updateMember(m.id, { assignedCases: [...assignedNos, v.caseNo] }); toast("Case assigned"); }}
      />
    );

  const info = [
    [User, "Full Name", m.name], [Mail, "Email Address", m.email], [Phone, "Phone Number", m.phone], [Building2, "Department", m.department],
    [CalendarDays, "Date of Joining", m.joined ? formatDate(m.joined) : "-"], [UserCog, "Reporting To", m.reportsTo],
  ];
  const tiles = [[assigned.length, "Total Cases", "bg-blue-50 text-blue-600"], [assigned.filter((c) => c.status === "Active").length, "Active Cases", "bg-emerald-50 text-emerald-600"], [hearings, "Upcoming Hearings", "bg-orange-50 text-orange-500"], [docs, "Documents", "bg-purple-50 text-purple-600"]];

  return (
    <div className="mx-auto flex max-w-350 flex-col gap-5">
      <nav className="flex items-center gap-2 text-sm text-slate-600">
        <Link href="/team" className="hover:text-brand">Team &amp; Roles</Link><ChevronRight size={14} /><span className="text-ink">{m.name}</span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar name={m.name} size="h-16 w-16" text="text-xl" solid={isOwner ? "bg-[#9a4a3a] text-white" : ""} />
          <div>
            <div className="flex flex-wrap items-center gap-3"><h1 className="text-3xl font-bold">{m.name}</h1><Badge className={statusStyle[m.status]}>{m.status}</Badge><Badge className={roleStyles[m.role] ?? "bg-slate-100 text-slate-600"}>{m.role}</Badge></div>
            <p className="text-sm text-slate-600">{m.title} &bull; {m.department}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={`mailto:${m.email}`} onClick={() => toast(`Opening email to ${m.email}`, "info")} className={outline}><Mail size={16} /> Email</a>
          {!isOwner && <button onClick={() => act.toggleMemberStatus(m)} className={outline}><Power size={16} /> Mark {m.status === "Active" ? "inactive" : "active"}</button>}
          <button onClick={() => act.editMember(m)} className={outline}><Pencil size={16} /> Edit</button>
          {!isOwner && <button onClick={() => act.deleteMember(m, () => router.push("/team"))} className={`${outline} text-red-600 hover:bg-red-50`}><Trash2 size={16} /> Remove</button>}
        </div>
      </div>

      <div className="stagger grid grid-cols-2 gap-4 xl:grid-cols-4">
        {tiles.map(([v, l, t]) => (
          <div key={l} className={`lift rounded-xl px-5 py-4 ${t}`}><p className="text-3xl font-bold"><CountUp value={v} /></p><p className="text-sm">{l}</p></div>
        ))}
      </div>

      <div className="stagger grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card title="Personal Information" action={<SmallBtn icon={Pencil} onClick={() => act.editMember(m)}>Edit</SmallBtn>}>
          <dl className="space-y-3.5 text-sm">
            {info.map(([Icon, k, v]) => (
              <div key={k} className="grid grid-cols-[22px_130px_1fr] items-start gap-2"><Icon size={16} className="mt-0.5 text-slate-500" /><dt className="text-slate-500">{k}</dt><dd className="break-words">{v || "-"}</dd></div>
            ))}
          </dl>
        </Card>

        <Card title="Roles & Permissions" action={<SmallBtn icon={ShieldCheck} onClick={() => act.roles()}>Role defaults</SmallBtn>}>
          <div className="mb-3 flex items-center gap-3 text-sm"><span className="text-slate-600">Primary Role</span><Badge className={roleStyles[m.role] ?? "bg-slate-100 text-slate-600"}>{m.role}</Badge></div>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {allPermissions.map((p) => {
              const Icon = permIcon[p] ?? FilePlus;
              const on = perms.includes(p);
              return (
                <li key={p}>
                  <label className={`flex cursor-pointer items-center gap-2.5 rounded-lg border px-3 py-2 text-sm transition ${on ? "border-blue-200 bg-blue-50 text-blue-700" : "border-line text-slate-500 hover:bg-slate-50"} ${isOwner ? "cursor-not-allowed opacity-80" : ""}`}>
                    <input type="checkbox" checked={on} disabled={isOwner} onChange={() => setPerm(p)} className="h-4 w-4 accent-brand" />
                    <Icon size={14} /> {p}
                  </label>
                </li>
              );
            })}
          </ul>
          {m.permissions && !isOwner && <button onClick={() => { s.updateMember(m.id, { permissions: undefined }); toast("Back to the role's default permissions"); }} className="mt-3 text-xs font-medium text-brand hover:underline">Reset to role defaults</button>}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.6fr_1fr]">
        <Card title={`Assigned Cases (${assigned.length})`} action={<SmallBtn icon={Plus} onClick={assign}>Assign case</SmallBtn>}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-120 text-left text-sm">
              <thead><tr className="bg-slate-50 text-slate-600">{["Case", "Type", "Status", "Next Hearing", ""].map((h) => <th key={h} className="px-3 py-2.5 font-medium">{h}</th>)}</tr></thead>
              <tbody className="divide-y divide-line">
                {assigned.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-slate-500">No cases assigned.</td></tr>}
                {assigned.map((c) => (
                  <tr key={c.id}>
                    <td className="px-3 py-3"><Link href={`/cases/${c.id}`} className="font-semibold hover:text-brand">{c.title}</Link><p className="text-xs text-slate-500">{c.caseNo}</p></td>
                    <td className="px-3 py-3"><Badge className={caseTypeStyles[c.type]}>{c.type}</Badge></td>
                    <td className="px-3 py-3"><Badge className={statusStyles[c.status]}>{c.status}</Badge></td>
                    <td className="px-3 py-3 text-slate-600">{c.hearingDate ? formatDate(c.hearingDate) : "-"}</td>
                    <td className="px-3 py-3 text-right"><button onClick={() => { s.updateMember(m.id, { assignedCases: assignedNos.filter((n) => n !== c.caseNo) }); toast("Case unassigned"); }} aria-label={`Unassign ${c.title}`} className="rounded p-1 text-slate-400 hover:text-red-500"><X size={15} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card title="Activity">
          <ul className="space-y-4 text-sm">
            {activityFor(m).map((a) => (
              <li key={a.text} className="flex gap-3"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" /><div><p className="font-medium">{a.text}</p><p className="text-xs text-slate-500">{/^\d{4}-/.test(a.when) ? formatDate(a.when) : a.when}</p></div></li>
            ))}
          </ul>
          <Link href="/cases" className="mt-4 flex items-center gap-2 text-sm font-medium text-brand"><FolderOpen size={15} /> Go to all cases</Link>
        </Card>
      </div>
    </div>
  );
}
