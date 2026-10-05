"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Calendar, Eye, Pencil, Plus, UserRoundCheck, Clock, Users, Briefcase, CloudUpload, Download, Mail, FolderPlus, StickyNote, Power, Trash2, X } from "lucide-react";
import Avatar from "@/components/Avatar";
import Badge from "@/components/Badge";
import CountUp from "@/components/ui/CountUp";
import FilterSelect from "@/components/FilterSelect";
import Pagination from "@/components/Pagination";
import RowMenu from "@/components/ui/RowMenu";
import { useStore, daysFrom } from "@/lib/store";
import { useActions } from "@/components/ui/ActionsProvider";
import { useToast } from "@/components/ui/Toast";
import { formatDate } from "@/lib/cases";
import { typeStyles } from "@/lib/clients";
import { downloadBlob, toCsv } from "@/lib/format";

const statusStyle = { Active: "bg-emerald-50 text-emerald-600", Inactive: "bg-red-50 text-red-600" };

function Stat({ label, value, sub, icon: Icon, tint, onClick, wide }) {
  return (
    <button onClick={onClick} className={`lift flex w-full items-center gap-3 rounded-xl border border-line bg-white p-3 text-left shadow-sm sm:gap-4 sm:p-5 ${wide ? "col-span-2 sm:col-span-1" : ""}`}>
      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl sm:h-16 sm:w-16 ${tint}`}><Icon size={26} strokeWidth={1.5} /></div>
      <div>
        <p className="text-xs text-slate-600 sm:text-sm">{label}</p>
        <p className="text-2xl font-bold leading-tight sm:text-3xl"><CountUp value={value} /></p>
        <p className="text-xs font-medium text-emerald-600">{sub}</p>
      </div>
    </button>
  );
}

export default function ClientsView() {
  const s = useStore();
  const act = useActions();
  const toast = useToast();
  const router = useRouter();
  const fileInput = useRef(null);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("All");
  const [status, setStatus] = useState("All");
  const [city, setCity] = useState("All");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [checked, setChecked] = useState(new Set());

  const clients = s.clients;
  const cities = useMemo(() => [...new Set(clients.map((c) => c.city).filter(Boolean))].sort(), [clients]);
  const total = clients.length;
  const active = clients.filter((c) => c.status === "Active").length;
  const recent = clients.filter((c) => daysFrom(s.today, c.added) >= -30).length;
  const share = (n) => (total ? `${Math.round((n / total) * 100)}% of total` : "-");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return clients.filter((c) => {
      if (type !== "All" && c.type !== type) return false;
      if (status !== "All" && c.status !== status) return false;
      if (city !== "All" && c.city !== city) return false;
      if (from && c.added < from) return false;
      if (to && c.added > to) return false;
      if (q && ![c.name, c.email, c.phone, c.city].some((v) => String(v ?? "").toLowerCase().includes(q))) return false;
      return true;
    });
  }, [clients, query, type, status, city, from, to]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pages);
  const visible = filtered.slice((current - 1) * pageSize, current * pageSize);
  const allChecked = visible.length > 0 && visible.every((c) => checked.has(c.id));
  const chosen = clients.filter((c) => checked.has(c.id));

  const reset = (fn) => (v) => { fn(v); setPage(1); };
  const clear = () => { setQuery(""); setType("All"); setStatus("All"); setCity("All"); setFrom(""); setTo(""); setPage(1); };
  const toggle = (id) => setChecked((x) => { const n = new Set(x); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setChecked((x) => { const n = new Set(x); visible.forEach((c) => (allChecked ? n.delete(c.id) : n.add(c.id))); return n; });

  const exportCsv = (list, name) => {
    downloadBlob(new Blob([toCsv(["Name", "Type", "Phone", "Email", "City", "Total Cases", "Active Cases", "Added On", "Status"], list.map((c) => [c.name, c.type, c.phone, c.email, c.city, c.totalCases, c.activeCases, formatDate(c.added), c.status]))], { type: "text/csv" }), name);
    toast(`Exported ${list.length} client${list.length === 1 ? "" : "s"}`);
  };

  const deleteChosen = () =>
    act.confirm({
      title: `Delete ${chosen.length} client${chosen.length > 1 ? "s" : ""}?`,
      message: "They will be removed from your client list. Their cases stay in place.",
      confirmLabel: "Delete",
      danger: true,
      onConfirm: () => { chosen.forEach((c) => s.deleteClient(c.id)); setChecked(new Set()); toast("Clients deleted"); },
    });

  const menu = (c) => [
    { label: "View profile", icon: Eye, onClick: () => router.push(`/clients/${c.id}`) },
    { label: "Edit client", icon: Pencil, onClick: () => act.editClient(c) },
    { label: "Add case", icon: FolderPlus, onClick: () => act.addCase({ client: c.name }) },
    { label: "Add note", icon: StickyNote, onClick: () => act.addNote({ key: `client:${c.id}`, title: c.name }) },
    { label: "Send email", icon: Mail, onClick: () => act.emailClient(c) },
    { label: c.status === "Active" ? "Mark inactive" : "Mark active", icon: Power, divider: true, onClick: () => act.toggleClientStatus(c) },
    { label: "Delete client", icon: Trash2, danger: true, onClick: () => act.deleteClient(c) },
  ];

  return (
    <div className="mx-auto flex max-w-350 flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl sm:h-13 sm:w-13 bg-pink-500 text-white"><Users size={26} /></div>
          <div className="min-w-0">
            <h1 className="text-3xl font-bold leading-tight">Clients</h1>
            <p className="text-slate-600">Manage your clients, contact details, and their associated cases.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <input ref={fileInput} type="file" accept=".csv,text/csv" className="hidden" onChange={(e) => { const f = e.target.files[0]; e.target.value = ""; if (f) act.importClients(f); }} />
          <button onClick={() => fileInput.current.click()} title="CSV columns: name, type, phone, email, city" className="flex items-center gap-2 rounded-lg border border-line bg-white px-5 py-3 text-sm font-medium hover:bg-slate-50"><CloudUpload size={17} /> Import Clients</button>
          <button onClick={() => exportCsv(filtered, "clients.csv")} className="flex items-center gap-2 rounded-lg border border-line bg-white px-5 py-3 text-sm font-medium hover:bg-slate-50"><Download size={17} /> Export</button>
          <button onClick={() => act.addClient()} className="flex items-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-dark"><Plus size={18} /> Add Client</button>
        </div>
      </div>

      <div className="stagger grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4">
        <Stat label="Total Clients" value={total} sub="all time" icon={Users} tint="bg-pink-100 text-pink-500" onClick={clear} />
        <Stat label="Active Clients" value={active} sub={share(active)} icon={Briefcase} tint="bg-blue-100 text-blue-600" onClick={() => { setStatus("Active"); setPage(1); }} />
        <Stat label="New Clients (30 days)" value={recent} sub="recently added" icon={Clock} tint="bg-orange-100 text-orange-500" wide onClick={() => { setFrom(new Date(Date.parse(s.today) - 30 * 86400000).toISOString().slice(0, 10)); setPage(1); }} />
        <div className="lift col-span-2 flex items-center gap-3 rounded-xl border border-line bg-white p-3 shadow-sm sm:col-span-1 sm:gap-4 sm:p-5 xl:col-span-1">
          <div className="flex h-11 w-11 shrink-0 sm:h-16 sm:w-16 items-center justify-center rounded-xl bg-purple-100 text-purple-600"><UserRoundCheck size={30} strokeWidth={1.5} /></div>
          <div className="flex flex-1 divide-x divide-line">
            <button onClick={() => { setType("Individual"); setPage(1); }} className="pr-5 text-left"><p className="text-sm text-slate-600">Individual</p><p className="text-3xl font-bold"><CountUp value={clients.filter((c) => c.type === "Individual").length} /></p></button>
            <button onClick={() => { setType("Corporate"); setPage(1); }} className="pl-5 text-left"><p className="text-sm text-slate-600">Corporate</p><p className="text-3xl font-bold"><CountUp value={clients.filter((c) => c.type === "Corporate").length} /></p></button>
          </div>
        </div>
      </div>

      <section className="min-w-0 rounded-xl border border-line bg-white shadow-sm">
        <form onSubmit={(e) => e.preventDefault()} className="flex flex-wrap items-end gap-3 p-4">
          <div className="relative min-w-52 flex-1">
            <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input value={query} onChange={(e) => reset(setQuery)(e.target.value)} placeholder="Search clients by name, phone, email..." className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none focus:border-brand focus:bg-white" />
          </div>
          <FilterSelect label="Client Type" value={type} onChange={reset(setType)} options={["Individual", "Corporate"]} />
          <FilterSelect label="Client Status" value={status} onChange={reset(setStatus)} options={["Active", "Inactive"]} />
          <FilterSelect label="City" value={city} onChange={reset(setCity)} options={cities} />
          <div className="w-full sm:w-auto">
            <span className="mb-1 block text-xs font-medium text-slate-600">Date Added</span>
            <div className="flex h-10 w-full items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm text-slate-600 sm:w-auto">
              <Calendar size={15} />
              <input type="date" value={from} onChange={(e) => reset(setFrom)(e.target.value)} aria-label="From date" className="min-w-0 flex-1 bg-transparent outline-none sm:w-31 sm:flex-none" />
              <span>-</span>
              <input type="date" value={to} onChange={(e) => reset(setTo)(e.target.value)} aria-label="To date" className="min-w-0 flex-1 bg-transparent outline-none sm:w-31 sm:flex-none" />
            </div>
          </div>
          <button type="button" onClick={clear} className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-medium hover:bg-slate-50">Clear</button>
          <button type="submit" className="h-10 rounded-lg bg-brand px-5 text-sm font-semibold text-white hover:bg-brand-dark">Search</button>
        </form>

        {chosen.length > 0 && (
          <div className="anim-drop mx-4 mb-3 flex flex-wrap items-center gap-3 rounded-lg bg-orange-50 px-4 py-2.5 text-sm">
            <b>{chosen.length} selected</b>
            <button onClick={() => exportCsv(chosen, "selected-clients.csv")} className="flex items-center gap-1.5 font-medium text-slate-700 hover:text-brand"><Download size={14} /> Export</button>
            <button onClick={deleteChosen} className="flex items-center gap-1.5 font-medium text-red-600"><Trash2 size={14} /> Delete</button>
            <button onClick={() => setChecked(new Set())} className="ml-auto flex items-center gap-1 text-slate-500 hover:text-ink"><X size={14} /> Clear</button>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-225 text-left text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-700">
                <th className="w-10 px-4 py-3"><input type="checkbox" checked={allChecked} onChange={toggleAll} className="h-4 w-4 accent-brand" aria-label="Select all" /></th>
                <th className="px-3 py-3 font-medium">Client Name</th>
                <th className="px-3 py-3 font-medium">Type</th>
                <th className="px-3 py-3 font-medium">Contact Details</th>
                <th className="px-3 py-3 font-medium">Total Cases</th>
                <th className="px-3 py-3 font-medium">Active Cases</th>
                <th className="px-3 py-3 font-medium">City</th>
                <th className="px-3 py-3 font-medium">Added On</th>
                <th className="px-3 py-3 font-medium">Status</th>
                <th className="px-3 py-3 text-center font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {visible.length === 0 && <tr><td colSpan={10} className="py-16 text-center text-slate-500">No clients found.</td></tr>}
              {visible.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3"><input type="checkbox" checked={checked.has(c.id)} onChange={() => toggle(c.id)} className="h-4 w-4 accent-brand" aria-label={`Select ${c.name}`} /></td>
                  <td className="px-3 py-3">
                    <Link href={`/clients/${c.id}`} className="flex items-center gap-3 hover:text-brand">
                      <Avatar name={c.name} corporate={c.type === "Corporate"} />
                      <span className="leading-snug"><span className="block font-semibold">{c.name}</span><span className="block text-xs text-slate-500">{c.type}</span></span>
                    </Link>
                  </td>
                  <td className="px-3 py-3"><Badge className={typeStyles[c.type]}>{c.type}</Badge></td>
                  <td className="px-3 py-3 text-xs leading-snug text-slate-600"><p>{c.phone || "-"}</p><p className="text-slate-500">{c.email || "-"}</p></td>
                  <td className="px-3 py-3 text-slate-600">{c.totalCases}</td>
                  <td className="px-3 py-3 text-slate-600">{c.activeCases}</td>
                  <td className="px-3 py-3 text-slate-600">{c.city || "-"}</td>
                  <td className="px-3 py-3 text-slate-600">{formatDate(c.added)}</td>
                  <td className="px-3 py-3"><Badge className={statusStyle[c.status]}>{c.status}</Badge></td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-center gap-1.5">
                      <Link href={`/clients/${c.id}`} aria-label="View" className="rounded-md bg-slate-100 p-2 text-slate-700 hover:bg-slate-200"><Eye size={16} /></Link>
                      <button onClick={() => act.editClient(c)} aria-label="Edit" className="rounded-md bg-slate-100 p-2 text-slate-700 hover:bg-slate-200"><Pencil size={16} /></button>
                      <RowMenu items={menu(c)} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Pagination total={filtered.length} page={current} pageSize={pageSize} onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(1); }} unit="clients" />
      </section>
    </div>
  );
}
