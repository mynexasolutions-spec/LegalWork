"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, Bookmark, GitCompare, ChevronDown } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { relevanceBadge as badge, matchColor as barColor } from "@/lib/aiData";
import Bar from "@/components/ui/Bar";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/ui/Toast";

const PAGE = 5;

function CompareModal({ items, onClose }) {
  const rows = [["Citation", (j) => j.cite], ["Court", (j) => j.court], ["Category", (j) => j.category], ["Relevance", (j) => j.relevance], ["Match", (j) => `${j.score}%`], ["Key holding", (j) => j.excerpt]];
  return (
    <Modal title="Compare judgments" subtitle={`${items.length} selected`} size="xl" onClose={onClose}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-175 text-left text-sm">
          <thead><tr><th className="w-28" />{items.map((j) => <th key={j.id} className="px-3 pb-3 font-bold">{j.title}</th>)}</tr></thead>
          <tbody className="divide-y divide-line">
            {rows.map(([label, get]) => (
              <tr key={label}><td className="py-3 pr-3 align-top text-slate-500">{label}</td>{items.map((j) => <td key={j.id} className="px-3 py-3 align-top leading-relaxed">{get(j)}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}

export default function SimilarCases({ items }) {
  const s = useStore();
  const toast = useToast();
  const [relevance, setRelevance] = useState("All");
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(PAGE);
  const [compare, setCompare] = useState([]);
  const [comparing, setComparing] = useState(false);

  const list = items.filter((c) => relevance === "All" || c.relevance === relevance);
  const picked = items.filter((c) => compare.includes(c.id));
  const flipCompare = (id) =>
    setCompare((c) => (c.includes(id) ? c.filter((x) => x !== id) : c.length >= 3 ? (toast("Compare up to 3 judgments at a time", "info"), c) : [...c, id]));
  const save = (j) => { s.toggleSaved(j.id); toast(s.saved.includes(j.id) ? "Removed from saved" : "Judgment saved"); };

  return (
    <section className="rounded-xl border border-line bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-orange-500"><Search size={26} strokeWidth={1.75} /></div>
        <div className="min-w-0 flex-1 basis-40">
          <h2 className="text-lg font-bold">Similar Cases</h2>
          <p className="text-sm text-slate-500">Cases with similar facts, legal issues and judgments</p>
        </div>
        <span className="w-full text-xs text-slate-500 sm:w-auto">Found {items.length} similar cases</span>
        {picked.length >= 2 && (
          <button onClick={() => setComparing(true)} className="anim-pop flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"><GitCompare size={15} /> Compare ({picked.length})</button>
        )}
        <div className="relative">
          <button onClick={() => setOpen(!open)} className="flex items-center gap-2 rounded-lg border border-line px-4 py-2.5 text-sm font-medium hover:bg-slate-50"><SlidersHorizontal size={15} /> Filters {relevance !== "All" && <span className="h-2 w-2 rounded-full bg-brand" />}</button>
          {open && (
            <div className="anim-drop absolute right-0 z-10 mt-2 w-52 rounded-lg border border-line bg-white p-1 shadow-lg">
              {["All", ...Object.keys(badge)].map((r) => (
                <button key={r} onClick={() => { setRelevance(r); setShown(PAGE); setOpen(false); }} className={`block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-slate-50 ${relevance === r ? "font-semibold text-brand" : ""}`}>{r}</button>
              ))}
            </div>
          )}
        </div>
      </div>

      <ul className="stagger space-y-4">
        {list.length === 0 && <li className="py-10 text-center text-sm text-slate-500">No cases match this filter.</li>}
        {list.slice(0, shown).map((c, i) => {
          const saved = s.saved.includes(c.id);
          return (
            <li key={c.id} className="flex flex-col gap-3 sm:flex-row sm:items-start sm:gap-4">
              <div className="hidden h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-orange-50 text-xl font-semibold text-orange-500 sm:flex">{i + 1}</div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Link href={`/ai-analysis/judgment/${c.id}`} className="text-left font-bold hover:text-brand"><span className="mr-1.5 text-orange-500 sm:hidden">{i + 1}.</span>{c.title}</Link>
                  <div className="flex items-center gap-4">
                    <span className={`rounded-md px-3 py-1 text-xs font-medium ${badge[c.relevance]}`}>{c.relevance}</span>
                    <div className="w-20">
                      <p className="text-xs"><b>{c.score}%</b> <span className="text-slate-400">Match</span></p>
                      <div className="mt-1 flex"><Bar pct={c.score} color={barColor(c.score)} height="h-1" /></div>
                    </div>
                  </div>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">{c.cite} <span className="mx-1">|</span> {c.court} <span className="mx-1">|</span> {c.category}</p>
                <p className="mt-2 rounded-md bg-red-50/60 px-3 py-2 text-xs leading-relaxed text-slate-600">&ldquo; {c.excerpt}</p>
              </div>
              <div className="flex shrink-0 gap-1.5 sm:w-30 sm:flex-col [&>*]:flex-1 sm:[&>*]:flex-none">
                <Link href={`/ai-analysis/judgment/${c.id}`} className="rounded-md border border-line py-1.5 text-center text-xs font-medium hover:bg-slate-50">View Judgment</Link>
                <button onClick={() => save(c)} className="flex items-center justify-center gap-1.5 rounded-md border border-line py-1.5 text-xs hover:bg-slate-50"><Bookmark size={13} className={saved ? "fill-brand text-brand" : ""} /> {saved ? "Saved" : "Save"}</button>
                <button onClick={() => flipCompare(c.id)} className={`flex items-center justify-center gap-1.5 rounded-md border py-1.5 text-xs hover:bg-slate-50 ${compare.includes(c.id) ? "border-brand text-brand" : "border-line"}`}><GitCompare size={13} /> {compare.includes(c.id) ? "Added" : "Compare"}</button>
              </div>
            </li>
          );
        })}
      </ul>

      {list.length > shown && (
        <button onClick={() => setShown(shown + PAGE)} className="mx-auto mt-5 flex items-center gap-2 rounded-lg border border-line px-5 py-2 text-sm font-medium hover:bg-slate-50">Show more ({list.length - shown} left) <ChevronDown size={15} /></button>
      )}

      {comparing && <CompareModal items={picked} onClose={() => setComparing(false)} />}
    </section>
  );
}
