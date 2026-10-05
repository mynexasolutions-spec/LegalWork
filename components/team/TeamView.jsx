"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Eye, Pencil, Plus, Users, UserCheck, ShieldCheck, Send, Settings, UserPlus, Crown, Power, Trash2, X, Download } from "lucide-react";
import Avatar from "@/components/Avatar";
import Badge from "@/components/Badge";
import CountUp from "@/components/ui/CountUp";
import FilterSelect from "@/components/FilterSelect";
import Pagination from "@/components/Pagination";
import RowMenu from "@/components/ui/RowMenu";
import { useStore } from "@/lib/store";
import { useActions } from "@/components/ui/ActionsProvider";
import { useToast } from "@/components/ui/Toast";
import { formatDate } from "@/lib/cases";
import { roleStyles } from "@/lib/team";
import { downloadBlob, toCsv } from "@/lib/format";

const statusStyle = { Active: "bg-emerald-50 text-emerald-600", Inactive: "bg-red-50 text-red-600" };
const outline = "flex items-center gap-2 rounded-lg border border-line bg-white px-3.5 py-2.5 text-sm font-medium hover:bg-slate-50 sm:px-5 sm:py-3";

function Stat({ label, value, icon: Icon, tint, onClick, wide }) {
  return (
    <button onClick={onClick} className={`lift flex h-full w-full items-center gap-3 rounded-xl border border-line bg-white p-3 text-left shadow-sm sm:gap-4 sm:p-5 ${wide ? "col-span-2 sm:col-span-1" : ""}`}>
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl sm:h-16 sm:w-16 ${tint}`}><Icon size={26} strokeWidth={1.5} /></div>
      <div className="min-w-0"><p className="text-xs text-slate-600 sm:text-sm">{label}</p><p className="text-2xl font-bold leading-tight sm:text-3xl"><CountUp value={value} /></p></div>
    </button>
  );
}

export default function TeamView() {
  const s = useStore();
  const act = useActions();
  const toast = useToast();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("All");
  const [status, setStatus] = useState("All");
  const [dept, setDept] = useState("All");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [checked, setChecked] = useState(new Set());

  const members = s.members;
  const departments = useMemo(() => [...new Set(members.map((m) => m.department).filter(Boolean))].sort(), [members]);
  const roleOptions = useMemo(() => [...new Set(members.map((m) => m.role))].sort(), [members]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return members.filter((m) => {
      if (role !== "All" && m.role !== role) return false;
      if (status !== "All" && m.status !== status) return false;
      if (dept !== "All" && m.department !== dept) return false;
      if (q && ![m.name, m.email, m.role, m.title].some((v) => String(v ?? "").toLowerCase().includes(q))) return false;
      return true;
    });
  }, [members, query, role, status, dept]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pages);
  const visible = filtered.slice((current - 1) * pageSize, current * pageSize);
  const allChecked = visible.length > 0 && visible.every((m) => checked.has(m.id));
  const chosen = members.filter((m) => checked.has(m.id) && m.id !== "m0");

  const reset = (fn) => (v) => { fn(v); setPage(1); };
  const clear = () => { setQuery(""); setRole("All"); setStatus("All"); setDept("All"); setPage(1); };
  const toggle = (id) => setChecked((x) => { const n = new Set(x); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setChecked((x) => { const n = new Set(x); visible.forEach((m) => (allChecked ? n.delete(m.id) : n.add(m.id))); return n; });

  const exportCsv = (list, name) => {
    downloadBlob(new Blob([toCsv(["Name", "Title", "Role", "Department", "Email", "Status", "Joined"], list.map((m) => [m.name, m.title, m.role, m.department, m.email, m.status, formatDate(m.joined)]))], { type: "text/csv" }), name);
    toast(`Exported ${list.length} member${list.length === 1 ? "" : "s"}`);
  };

  const removeChosen = () =>
    act.confirm({
      title: `Remove ${chosen.length} member${chosen.length > 1 ? "s" : ""}?`,
      message: "They will lose access and be removed from the team list.",
      confirmLabel: "Remove",
      danger: true,
      onConfirm: () => { chosen.forEach((m) => s.deleteMember(m.id)); setChecked(new Set()); toast("Members removed"); },
    });

  const menu = (m) => [
    { label: "View profile", icon: Eye, onClick: () => router.push(`/team/${m.id}`) },
    { label: "Edit member", icon: Pencil, onClick: () => act.editMember(m) },
    { label: m.status === "Active" ? "Mark inactive" : "Mark active", icon: Power, hidden: m.id === "m0", onClick: () => act.toggleMemberStatus(m) },
    { label: "Remove member", icon: Trash2, danger: true, divider: true, hidden: m.id === "m0", onClick: () => act.deleteMember(m) },
  ];

  return (
    <div className="mx-auto flex max-w-350 flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl sm:h-13 sm:w-13 bg-purple-600 text-white"><Users size={26} /></div>
          <div className="min-w-0">
            <h1 className="text-3xl font-bold leading-tight">Team &amp; Roles</h1>
            <p className="text-slate-600">Manage your team members, roles, permissions and access control.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button onClick={() => act.roles()} className={outline}><Settings size={17} /> Role Management</button>
          <button onClick={() => act.invite()} className={outline}><Send size={17} /> Invite Member</button>
          <button onClick={() => act.addMember()} className="flex items-center gap-2 rounded-lg bg-brand px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-brand-dark sm:px-5 sm:py-3"><Plus size={18} /> Add Member</button>
        </div>
      </div>

      <div className="stagger grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-5">
        <Stat label="Total Members" value={members.length} icon={Users} tint="bg-red-100 text-red-500" onClick={clear} />
        <Stat label="Active Members" value={members.filter((m) => m.status === "Active").length} icon={UserCheck} tint="bg-emerald-100 text-emerald-600" onClick={() => { setStatus("Active"); setPage(1); }} />
        <Stat label="Roles" value={Object.keys(s.roles).length} icon={Crown} tint="bg-orange-100 text-orange-500" onClick={() => act.roles()} />
        <Stat label="Admins" value={members.filter((m) => m.role === "Administrator").length} icon={ShieldCheck} tint="bg-purple-100 text-purple-600" onClick={() => { setRole("Administrator"); setPage(1); }} />
        <Stat label="Pending Invites" value={s.invites.length} icon={UserPlus} tint="bg-blue-100 text-blue-600" wide onClick={() => act.roles()} />
      </div>

      <section className="min-w-0 rounded-xl border border-line bg-white shadow-sm">
        <form onSubmit={(e) => e.preventDefault()} className="flex flex-wrap items-end gap-3 p-4">
          <div className="relative min-w-52 flex-1">
            <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input value={query} onChange={(e) => reset(setQuery)(e.target.value)} placeholder="Search team members by name, email or role..." className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none focus:border-brand focus:bg-white" />
          </div>
          <FilterSelect label="Role" value={role} onChange={reset(setRole)} options={roleOptions} allLabel="All Roles" />
          <FilterSelect label="Status" value={status} onChange={reset(setStatus)} options={["Active", "Inactive"]} allLabel="All Status" />
          <FilterSelect label="Department" value={dept} onChange={reset(setDept)} options={departments} allLabel="All Departments" />
          <button type="button" onClick={clear} className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-medium hover:bg-slate-50">Clear</button>
          <button type="button" onClick={() => exportCsv(filtered, "team.csv")} className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-medium hover:bg-slate-50"><Download size={15} /> Export</button>
        </form>

        {chosen.length > 0 && (
          <div className="anim-drop mx-4 mb-3 flex flex-wrap items-center gap-3 rounded-lg bg-orange-50 px-4 py-2.5 text-sm">
            <b>{chosen.length} selected</b>
            <button onClick={() => exportCsv(chosen, "selected-team.csv")} className="flex items-center gap-1.5 font-medium text-slate-700 hover:text-brand"><Download size={14} /> Export</button>
            <button onClick={removeChosen} className="flex items-center gap-1.5 font-medium text-red-600"><Trash2 size={14} /> Remove</button>
            <button onClick={() => setChecked(new Set())} className="ml-auto flex items-center gap-1 text-slate-500 hover:text-ink"><X size={14} /> Clear</button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-215 text-left text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-700">
                <th className="w-10 px-4 py-3"><input type="checkbox" checked={allChecked} onChange={toggleAll} className="h-4 w-4 accent-brand" aria-label="Select all" /></th>
                <th className="px-3 py-3 font-medium">Name</th>
                <th className="px-3 py-3 font-medium">Role</th>
                <th className="px-3 py-3 font-medium">Department</th>
                <th className="px-3 py-3 font-medium">Email</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 font-medium">Joined On</th>
                <th className="px-3 py-3 text-center font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {visible.length === 0 && <tr><td colSpan={8} className="py-16 text-center text-slate-500">No team members found.</td></tr>}
              {visible.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3"><input type="checkbox" checked={checked.has(m.id)} onChange={() => toggle(m.id)} className="h-4 w-4 accent-brand" aria-label={`Select ${m.name}`} /></td>
                  <td className="px-3 py-3">
                    <Link href={`/team/${m.id}`} className="flex items-center gap-3 hover:text-brand">
                      <Avatar name={m.name} solid={m.id === "m0" ? "bg-[#9a4a3a] text-white" : ""} />
                      <span className="leading-snug"><span className="block font-semibold">{m.name}</span><span className="block text-xs text-slate-500">{m.title}</span></span>
                    </Link>
                  </td>
                  <td className="px-3 py-3"><Badge className={roleStyles[m.role] ?? "bg-slate-100 text-slate-600"}>{m.role}</Badge></td>
                  <td className="px-3 py-3 text-slate-600">{m.department}</td>
                  <td className="px-3 py-3 text-slate-600">{m.email}</td>
                  <td className="px-3 py-3"><Badge className={statusStyle[m.status]}>{m.status}</Badge></td>
                  <td className="px-3 py-3 text-slate-600">{m.joined ? formatDate(m.joined) : "-"}</td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-center gap-1.5">
                      <Link href={`/team/${m.id}`} aria-label="View" className="rounded-md bg-slate-100 p-2 text-slate-700 hover:bg-slate-200"><Eye size={16} /></Link>
                      <button onClick={() => act.editMember(m)} aria-label="Edit" className="rounded-md bg-slate-100 p-2 text-slate-700 hover:bg-slate-200"><Pencil size={16} /></button>
                      <RowMenu items={menu(m)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination total={filtered.length} page={current} pageSize={pageSize} onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(1); }} unit="members" />
      </section>
    </div>
  );
}
