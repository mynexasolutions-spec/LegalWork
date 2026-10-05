"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search, Calendar, Eye, Download, ArrowUpDown, FileText, Plus, FolderPlus, Files, Briefcase, Scale, FileStack, Pencil, Share2, Trash2, Undo2, FolderInput, X,
} from "lucide-react";
import Badge from "@/components/Badge";
import StatCard from "@/components/StatCard";
import FilterSelect from "@/components/FilterSelect";
import Pagination from "@/components/Pagination";
import RowMenu from "@/components/ui/RowMenu";
import FormModal from "@/components/ui/FormModal";
import FileIcon from "./FileIcon";
import FolderPanel from "./FolderPanel";
import { useStore } from "@/lib/store";
import { useActions } from "@/components/ui/ActionsProvider";
import { useToast } from "@/components/ui/Toast";
import { formatDate, caseSlug } from "@/lib/cases";
import { formatSize } from "@/lib/format";
import { docTypes, folders, typeStyles } from "@/lib/documents";

export default function DocumentsView() {
  const s = useStore();
  const act = useActions();
  const toast = useToast();
  const router = useRouter();
  const [folder, setFolder] = useState("all");
  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState("");
  const [caseTitle, setCaseTitle] = useState("All");
  const [type, setType] = useState("All");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [dir, setDir] = useState("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [checked, setChecked] = useState(new Set());

  const docs = useMemo(() => s.documents.map((d) => ({ ...d, caseTitle: d.caseNo ? s.caseTitle(d.caseNo) : "General" })), [s.documents, s.cases]);
  const live = docs.filter((d) => !d.trashed);
  const inTrash = folder === "trash";
  const caseOptions = useMemo(() => [...new Set(docs.map((d) => d.caseTitle))].sort(), [docs]);

  const folderDef = folders.find((f) => f.id === folder);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return docs
      .filter((d) => {
        if (inTrash ? !d.trashed : d.trashed) return false;
        if (!inTrash) {
          if (folderDef) { if (folderDef.types && !folderDef.types.includes(d.type)) return false; }
          else if (d.folderId !== folder) return false; // a custom folder
        }
        if (caseTitle !== "All" && d.caseTitle !== caseTitle) return false;
        if (type !== "All" && d.type !== type) return false;
        if (from && d.date < from) return false;
        if (to && d.date > to) return false;
        if (q && ![d.name, d.caseTitle, d.caseNo, d.type].some((v) => String(v).toLowerCase().includes(q))) return false;
        return true;
      })
      .sort((a, b) => a.ts.localeCompare(b.ts) * (dir === "asc" ? 1 : -1));
  }, [docs, folder, folderDef, inTrash, caseTitle, type, from, to, query, dir]);

  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pages);
  const visible = filtered.slice((current - 1) * pageSize, current * pageSize);
  const allChecked = visible.length > 0 && visible.every((d) => checked.has(d.id));
  const chosen = [...checked].filter((id) => docs.some((d) => d.id === id));

  const reset = (fn) => (v) => { fn(v); setPage(1); };
  const clear = () => { setQuery(""); setCaseTitle("All"); setType("All"); setFrom(""); setTo(""); setPage(1); };
  const toggle = (id) => setChecked((x) => { const n = new Set(x); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const toggleAll = () => setChecked((x) => { const n = new Set(x); visible.forEach((d) => (allChecked ? n.delete(d.id) : n.add(d.id))); return n; });
  const count = (types) => live.filter((d) => types.includes(d.type)).length;

  const moveTo = (d) =>
    act.show(
      <FormModal
        size="sm"
        title="Move to folder"
        subtitle={d.name}
        submitLabel="Move"
        initial={{ folderId: d.folderId ?? "" }}
        onClose={act.close}
        fields={[{ name: "folderId", label: "Folder", type: "select", options: s.folders.map((f) => ({ value: f.id, label: f.label })), placeholder: "No custom folder" }]}
        onSubmit={(v) => { s.updateDocument(d.id, { folderId: v.folderId || null }); toast(v.folderId ? "Moved to folder" : "Removed from folder"); }}
      />
    );

  const purge = (ids) =>
    act.confirm({
      title: "Delete permanently?",
      message: `${ids.length > 1 ? `${ids.length} documents` : "This document"} will be deleted for good. This can't be undone.`,
      confirmLabel: "Delete forever",
      danger: true,
      onConfirm: () => { s.purgeDocuments(ids); setChecked(new Set()); toast("Deleted permanently"); },
    });

  const menu = (d) =>
    inTrash
      ? [
          { label: "Restore", icon: Undo2, onClick: () => { s.restoreDocuments([d.id]); toast("Document restored"); } },
          { label: "Delete permanently", icon: Trash2, danger: true, divider: true, onClick: () => purge([d.id]) },
        ]
      : [
          { label: "Open", icon: Eye, onClick: () => router.push(`/documents/${d.id}`) },
          { label: "Download", icon: Download, onClick: () => act.downloadDoc(d) },
          { label: "Rename", icon: Pencil, onClick: () => act.renameDoc(d) },
          { label: "Share link", icon: Share2, onClick: () => act.shareDoc(d) },
          { label: "Move to folder", icon: FolderInput, hidden: s.folders.length === 0, onClick: () => moveTo(d) },
          { label: "Move to Trash", icon: Trash2, danger: true, divider: true, onClick: () => act.trashDocs([d.id]) },
        ];

  return (
    <div className="mx-auto flex max-w-350 flex-col gap-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl sm:h-13 sm:w-13 bg-purple-600 text-white"><FileText size={26} /></div>
          <div className="min-w-0">
            <h1 className="text-3xl font-bold leading-tight">Documents</h1>
            <p className="text-slate-600">Manage, view and organize all your case documents in one place.</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={() => setAdding(true)} className="flex items-center gap-2 rounded-lg border border-line bg-white px-5 py-3 text-sm font-medium hover:bg-slate-50"><FolderPlus size={17} /> New Folder</button>
          <button onClick={() => act.upload()} className="flex items-center gap-2 rounded-lg bg-brand px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-brand-dark"><Plus size={18} /> Upload Document</button>
        </div>
      </div>

      <div className="stagger grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-5">
        <StatCard label="Total Documents" value={live.length} iconBg="bg-red-100 text-red-500" icon={<FileText size={30} strokeWidth={1.5} />} onClick={() => setFolder("all")} />
        <StatCard label="Case Files" value={folders[1].types.reduce((a, t) => a + count([t]), 0)} iconBg="bg-blue-100 text-blue-600" icon={<Files size={30} strokeWidth={1.5} />} onClick={() => setFolder("case")} />
        <StatCard label="Evidence Files" value={count(["Evidence"])} iconBg="bg-orange-100 text-orange-500" icon={<Briefcase size={30} strokeWidth={1.5} />} onClick={() => setFolder("evidence")} />
        <StatCard label="Court Orders" value={count(["Court Order"])} iconBg="bg-purple-100 text-purple-600" icon={<Scale size={30} strokeWidth={1.5} />} onClick={() => setFolder("orders")} />
        <StatCard label="Other Documents" value={count(["Other"])} iconBg="bg-sky-100 text-sky-600" icon={<FileStack size={30} strokeWidth={1.5} />} onClick={() => setFolder("others")} />
      </div>

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[240px_1fr]">
        <FolderPanel
          active={folder}
          onSelect={(id) => { setFolder(id); setPage(1); setChecked(new Set()); }}
          docs={docs}
          custom={s.folders}
          adding={adding}
          setAdding={setAdding}
          onAddFolder={(label) => { s.addFolder(label); toast(`Folder "${label}" created`); }}
          onRemoveFolder={s.removeFolder}
        />

        <section className="min-w-0 rounded-xl border border-line bg-white shadow-sm">
          <form onSubmit={(e) => e.preventDefault()} className="flex flex-wrap items-end gap-3 p-4">
            <div className="relative min-w-52 flex-1">
              <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input value={query} onChange={(e) => reset(setQuery)(e.target.value)} placeholder="Search documents by name, case, type..." className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none focus:border-brand focus:bg-white" />
            </div>
            <FilterSelect label="Case" value={caseTitle} onChange={reset(setCaseTitle)} options={caseOptions} allLabel="All Cases" />
            <FilterSelect label="Type" value={type} onChange={reset(setType)} options={docTypes} allLabel="All Types" />
            <div className="w-full sm:w-auto">
              <span className="mb-1 block text-xs font-medium text-slate-600">Date Range</span>
              <div className="flex h-10 w-full items-center gap-2 rounded-lg border border-slate-200 px-3 text-sm text-slate-600 sm:w-auto">
                <Calendar size={15} />
                <input type="date" value={from} onChange={(e) => reset(setFrom)(e.target.value)} aria-label="From date" className="min-w-0 flex-1 bg-transparent outline-none sm:w-31 sm:flex-none" />
                <span>-</span>
                <input type="date" value={to} onChange={(e) => reset(setTo)(e.target.value)} aria-label="To date" className="min-w-0 flex-1 bg-transparent outline-none sm:w-31 sm:flex-none" />
              </div>
            </div>
            <button type="button" onClick={clear} className="h-10 rounded-lg border border-slate-200 px-4 text-sm font-medium hover:bg-slate-50">Clear</button>
          </form>

          {chosen.length > 0 && (
            <div className="anim-drop mx-4 mb-3 flex flex-wrap items-center gap-3 rounded-lg bg-orange-50 px-4 py-2.5 text-sm">
              <b>{chosen.length} selected</b>
              {inTrash ? (
                <>
                  <button onClick={() => { s.restoreDocuments(chosen); setChecked(new Set()); toast("Documents restored"); }} className="flex items-center gap-1.5 font-medium text-emerald-700"><Undo2 size={14} /> Restore</button>
                  <button onClick={() => purge(chosen)} className="flex items-center gap-1.5 font-medium text-red-600"><Trash2 size={14} /> Delete forever</button>
                </>
              ) : (
                <>
                  <button onClick={() => chosen.forEach((id) => act.downloadDoc(docs.find((d) => d.id === id)))} className="flex items-center gap-1.5 font-medium text-slate-700 hover:text-brand"><Download size={14} /> Download</button>
                  <button onClick={() => act.trashDocs(chosen, () => setChecked(new Set()))} className="flex items-center gap-1.5 font-medium text-red-600"><Trash2 size={14} /> Move to Trash</button>
                </>
              )}
              <button onClick={() => setChecked(new Set())} className="ml-auto flex items-center gap-1 text-slate-500 hover:text-ink"><X size={14} /> Clear</button>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full min-w-175 text-left text-sm">
              <thead>
                <tr className="bg-slate-50 text-slate-700">
                  <th className="w-10 px-4 py-3"><input type="checkbox" checked={allChecked} onChange={toggleAll} className="h-4 w-4 accent-brand" aria-label="Select all" /></th>
                  <th className="px-3 py-3 font-medium">Document Name</th>
                  <th className="px-3 py-3 font-medium">Related Case</th>
                  <th className="px-3 py-3 font-medium">Type</th>
                  <th className="px-3 py-3"><button onClick={() => setDir(dir === "asc" ? "desc" : "asc")} className="flex items-center gap-1.5 font-medium">Date Added <ArrowUpDown size={13} className="text-slate-500" /></button></th>
                  <th className="px-3 py-3 font-medium">Size</th>
                  <th className="px-3 py-3 text-center font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {visible.length === 0 && <tr><td colSpan={7} className="py-16 text-center text-slate-500">{inTrash ? "Trash is empty." : "No documents found."}</td></tr>}
                {visible.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3"><input type="checkbox" checked={checked.has(d.id)} onChange={() => toggle(d.id)} className="h-4 w-4 accent-brand" aria-label={`Select ${d.name}`} /></td>
                    <td className="px-3 py-3">
                      <Link href={`/documents/${d.id}`} className="flex items-center gap-3 hover:text-brand">
                        <FileIcon kind={d.kind} />
                        <span className="max-w-44 truncate font-medium" title={d.name}>{d.name}</span>
                      </Link>
                    </td>
                    <td className="px-3 py-3">
                      {d.caseNo ? (<><Link href={`/cases/${caseSlug(d.caseNo)}`} className="font-medium hover:text-brand">{d.caseTitle}</Link><p className="text-xs text-slate-500">{d.caseNo}</p></>) : <span className="text-slate-400">General</span>}
                    </td>
                    <td className="px-3 py-3"><Badge className={typeStyles[d.type]}>{d.type}</Badge></td>
                    <td className="px-3 py-3 text-xs leading-tight text-slate-600"><p>{formatDate(d.date)}</p><p className="text-slate-400">{d.time}</p></td>
                    <td className="px-3 py-3 text-slate-500">{formatSize(d.sizeKb)}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center justify-center gap-1.5">
                        <Link href={`/documents/${d.id}`} aria-label="Open" className="rounded-md bg-slate-100 p-2 text-slate-700 hover:bg-slate-200"><Eye size={16} /></Link>
                        <button onClick={() => act.downloadDoc(d)} aria-label="Download" className="rounded-md bg-slate-100 p-2 text-slate-700 hover:bg-slate-200"><Download size={16} /></button>
                        <RowMenu items={menu(d)} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Pagination total={filtered.length} page={current} pageSize={pageSize} onPage={setPage} onPageSize={(n) => { setPageSize(n); setPage(1); }} unit="documents" />
        </section>
      </div>
    </div>
  );
}
