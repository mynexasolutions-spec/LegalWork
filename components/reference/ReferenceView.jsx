"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { BookOpen, Search, Bookmark, Copy, FolderPlus, Scale, Landmark } from "lucide-react";
import Badge from "@/components/Badge";
import FilterSelect from "@/components/FilterSelect";
import { useStore } from "@/lib/store";
import { useActions } from "@/components/ui/ActionsProvider";
import { useToast } from "@/components/ui/Toast";
import { allJudgments, allStatutes } from "@/lib/aiData";
import { caseTypes } from "@/lib/cases";
import { caseTypeStyles } from "@/lib/data";

const statutes = [...new Map(allStatutes.map((x) => [x.title, x])).values()];

export default function ReferenceView() {
  const s = useStore();
  const act = useActions();
  const toast = useToast();
  const [tab, setTab] = useState("Judgments");
  const [query, setQuery] = useState("");
  const [court, setCourt] = useState("All");
  const [type, setType] = useState("All");
  const [sort, setSort] = useState("Newest");

  const courts = useMemo(() => [...new Set(allJudgments.map((j) => j.court))].sort(), []);
  const q = query.trim().toLowerCase();

  const judgments = useMemo(
    () =>
      allJudgments
        .filter((j) => (tab === "Saved" ? s.saved.includes(j.id) : true))
        .filter((j) => (court === "All" || j.court === court) && (type === "All" || j.type === type))
        .filter((j) => !q || [j.title, j.cite, j.court, j.excerpt, j.category].some((v) => v.toLowerCase().includes(q)))
        .sort((a, b) => (sort === "Newest" ? b.year - a.year : sort === "Oldest" ? a.year - b.year : b.score - a.score)),
    [tab, court, type, q, sort, s.saved]
  );
  const statuteList = useMemo(
    () => statutes.filter((x) => (type === "All" || x.type === type) && (!q || [x.title, x.note, x.detail].some((v) => v.toLowerCase().includes(q)))),
    [type, q]
  );

  const copy = async (text) => {
    try { await navigator.clipboard.writeText(text); toast("Copied to clipboard"); } catch { toast(text, "info"); }
  };
  const attach = (title, text) => act.attachReference({ title, text });
  const save = (j) => { s.toggleSaved(j.id); toast(s.saved.includes(j.id) ? "Removed from saved" : "Judgment saved"); };

  const TABS = [["Judgments", allJudgments.length], ["Statutes", statutes.length], ["Saved", s.saved.length]];

  return (
    <div className="mx-auto flex max-w-350 flex-col gap-5">
      <div className="flex items-start gap-4">
        <div className="flex h-13 w-13 items-center justify-center rounded-xl bg-sky-600 text-white"><BookOpen size={26} /></div>
        <div>
          <h1 className="text-3xl font-bold leading-tight">Case Reference</h1>
          <p className="text-slate-600">Search judgments and statutes, save the ones you rely on, and attach them to a case.</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map(([t, n]) => (
          <button key={t} onClick={() => setTab(t)} className={`flex items-center gap-2.5 rounded-lg border px-5 py-2.5 text-sm font-medium transition ${tab === t ? "border-brand bg-orange-50" : "border-transparent bg-white text-slate-700 hover:border-line"}`}>
            {t}
            <span className={`flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs ${tab === t ? "bg-brand text-white" : "bg-slate-100 text-slate-700"}`}>{n}</span>
          </button>
        ))}
      </div>

      <section className="rounded-xl border border-line bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-3">
          <div className="relative min-w-60 flex-1">
            <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={tab === "Statutes" ? "Search statutes and sections..." : "Search by party, citation, court or holding..."} className="h-10 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm outline-none focus:border-brand focus:bg-white" />
          </div>
          <FilterSelect label="Area of law" value={type} onChange={setType} options={caseTypes} />
          {tab !== "Statutes" && <FilterSelect label="Court" value={court} onChange={setCourt} options={courts} />}
          {tab !== "Statutes" && (
            <label className="block min-w-32.5">
              <span className="mb-1 block text-xs font-medium text-slate-600">Sort by</span>
              <select value={sort} onChange={(e) => setSort(e.target.value)} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-brand">
                {["Newest", "Oldest", "Most relevant"].map((o) => <option key={o}>{o}</option>)}
              </select>
            </label>
          )}
          <button onClick={() => { setQuery(""); setCourt("All"); setType("All"); setSort("Newest"); }} className="h-10 rounded-lg border border-slate-200 px-5 text-sm font-medium hover:bg-slate-50">Clear</button>
        </div>
      </section>

      {tab !== "Statutes" ? (
        <ul key={tab + type + court + sort} className="stagger grid grid-cols-1 gap-4 xl:grid-cols-2">
          {judgments.length === 0 && <li className="col-span-full rounded-xl border border-line bg-white py-16 text-center text-slate-500 shadow-sm">{tab === "Saved" ? "Nothing saved yet. Use the bookmark on any judgment." : "No judgments match your search."}</li>}
          {judgments.map((j) => {
            const saved = s.saved.includes(j.id);
            return (
              <li key={j.id} className="lift flex flex-col gap-3 rounded-xl border border-line bg-white p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-sky-600"><Scale size={20} /></span>
                  <div className="min-w-0 flex-1">
                    <Link href={`/ai-analysis/judgment/${j.id}`} className="text-left font-bold hover:text-brand">{j.title}</Link>
                    <p className="text-xs text-slate-500">{j.cite} <span className="mx-1">|</span> {j.court}</p>
                  </div>
                  <Badge className={caseTypeStyles[j.type]}>{j.type}</Badge>
                </div>
                <p className="line-clamp-3 text-sm leading-relaxed text-slate-600">{j.excerpt}</p>
                <div className="mt-auto flex flex-wrap items-center gap-2">
                  <Link href={`/ai-analysis/judgment/${j.id}`} className="rounded-md border border-line px-4 py-1.5 text-xs font-medium hover:bg-slate-50">Read</Link>
                  <button onClick={() => save(j)} className="flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-xs hover:bg-slate-50"><Bookmark size={13} className={saved ? "fill-brand text-brand" : ""} /> {saved ? "Saved" : "Save"}</button>
                  <button onClick={() => copy(`${j.title}, ${j.cite}`)} className="flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-xs hover:bg-slate-50"><Copy size={13} /> Cite</button>
                  <button onClick={() => attach(j.title, `${j.title}, ${j.cite}`)} className="ml-auto flex items-center gap-1.5 rounded-md bg-orange-50 px-3 py-1.5 text-xs font-medium text-brand hover:bg-orange-100"><FolderPlus size={13} /> Attach to case</button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <ul key={type} className="stagger grid grid-cols-1 gap-4 xl:grid-cols-2">
          {statuteList.length === 0 && <li className="col-span-full rounded-xl border border-line bg-white py-16 text-center text-slate-500 shadow-sm">No statutes match your search.</li>}
          {statuteList.map((x) => (
            <li key={x.title} className="lift flex flex-col gap-3 rounded-xl border border-line bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600"><Landmark size={20} /></span>
                <div className="min-w-0 flex-1"><p className="font-bold">{x.title}</p><p className="text-xs text-slate-500">{x.note}</p></div>
                <Badge className={caseTypeStyles[x.type]}>{x.type}</Badge>
              </div>
              <p className="text-sm leading-relaxed text-slate-600">{x.detail}</p>
              <div className="mt-auto flex gap-2">
                <button onClick={() => copy(`${x.title} - ${x.note}`)} className="flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-xs hover:bg-slate-50"><Copy size={13} /> Copy</button>
                <button onClick={() => attach(x.title, `${x.title} - ${x.note}`)} className="ml-auto flex items-center gap-1.5 rounded-md bg-orange-50 px-3 py-1.5 text-xs font-medium text-brand hover:bg-orange-100"><FolderPlus size={13} /> Attach to case</button>
              </div>
            </li>
          ))}
        </ul>
      )}

    </div>
  );
}
