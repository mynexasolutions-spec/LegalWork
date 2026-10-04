"use client";

import { useState } from "react";
import { Folder, Plus, Trash2, X } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { folders } from "@/lib/documents";

export default function FolderPanel({ active, onSelect, docs, custom, onAddFolder, onRemoveFolder, adding, setAdding }) {
  const toast = useToast();
  const [name, setName] = useState("");
  const live = docs.filter((d) => !d.trashed);

  const submit = (e) => {
    e.preventDefault();
    const n = name.trim();
    if (n) onAddFolder(n);
    setName("");
    setAdding(false);
  };

  const rows = [
    ...folders.slice(0, -1).map((f) => ({ id: f.id, label: f.label, count: f.types === null ? live.length : live.filter((d) => f.types.includes(d.type)).length })),
    ...custom.map((f) => ({ id: f.id, label: f.label, count: live.filter((d) => d.folderId === f.id).length, custom: true })),
    { id: "trash", label: "Trash", count: docs.filter((d) => d.trashed).length, danger: true },
  ];

  return (
    <div className="flex flex-col gap-5">
      <section className="rounded-xl border border-line bg-white p-3 shadow-sm">
        <div className="mb-2 flex items-center justify-between px-2 pt-1">
          <h2 className="font-bold">Folders</h2>
          <button onClick={() => setAdding(!adding)} aria-label="New folder" className="rounded-md p-1 hover:bg-slate-100"><Plus size={18} /></button>
        </div>
        {adding && (
          <form onSubmit={submit} className="anim-drop mb-2 flex gap-1.5 px-1">
            <input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Folder name" className="h-9 min-w-0 flex-1 rounded-md border border-slate-200 px-2.5 text-sm outline-none focus:border-brand" />
            <button className="rounded-md bg-brand px-3 text-xs font-semibold text-white">Add</button>
          </form>
        )}
        <ul className="flex gap-2 overflow-x-auto pb-1 xl:block xl:gap-0 xl:overflow-visible xl:pb-0">
          {rows.map((f) => {
            const Icon = f.danger ? Trash2 : Folder;
            const on = active === f.id;
            return (
              <li key={f.id} className="group relative shrink-0">
                <button onClick={() => onSelect(f.id)} className={`flex w-full items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm transition max-xl:border max-xl:border-line ${on ? "bg-peach font-semibold" : "hover:bg-slate-50"} ${f.danger ? "text-red-600" : ""}`}>
                  <Icon size={18} strokeWidth={1.75} />
                  <span className="flex-1 truncate text-left">{f.label}</span>
                  <span className={`text-xs ${on ? "font-semibold text-brand" : "text-slate-500"}`}>{f.count}</span>
                </button>
                {f.custom && (
                  <button onClick={() => { onRemoveFolder(f.id); toast("Folder removed (its documents are back in All Documents)", "info"); if (on) onSelect("all"); }} aria-label={`Remove ${f.label}`} className="absolute right-8 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-300 opacity-0 hover:text-red-500 group-hover:opacity-100"><X size={13} /></button>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
