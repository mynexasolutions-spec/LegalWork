"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ChevronRight, Bookmark, Copy, FolderPlus, Scale, Landmark, ArrowLeft, Gavel, CalendarDays, Building2, Tag } from "lucide-react";
import Badge from "@/components/Badge";
import Bar from "@/components/ui/Bar";
import { useStore } from "@/lib/store";
import { useActions } from "@/components/ui/ActionsProvider";
import { useToast } from "@/components/ui/Toast";
import { allJudgments, judgmentById, lawsForType, relevanceBadge, matchColor } from "@/lib/aiData";
import { caseTypeStyles } from "@/lib/data";

const outline = "flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-medium hover:bg-slate-50";

export default function JudgmentPage({ id }) {
  const s = useStore();
  const act = useActions();
  const toast = useToast();
  const j = judgmentById(id);

  useEffect(() => { document.title = j ? `${j.title} - LexPro` : "Judgment not found - LexPro"; }, [j]);

  if (!j) {
    return (
      <div className="mx-auto max-w-3xl pt-10">
        <div className="flex flex-col items-center gap-3 rounded-xl border border-line bg-white py-16 text-slate-500 shadow-sm">
          <Scale size={32} strokeWidth={1.5} />
          <p className="text-sm">This judgment couldn&apos;t be found.</p>
          <Link href="/ai-analysis" className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white">Back to AI Analysis</Link>
        </div>
      </div>
    );
  }

  const saved = s.saved.includes(j.id);
  const laws = lawsForType(j.type);
  const related = allJudgments.filter((x) => x.type === j.type && x.id !== j.id).slice(0, 4);
  const copy = async () => {
    try { await navigator.clipboard.writeText(`${j.title}, ${j.cite}`); toast("Citation copied"); } catch { toast(`${j.title}, ${j.cite}`, "info"); }
  };
  const facts = [[Building2, "Court", j.court], [CalendarDays, "Year", j.year || "-"], [Tag, "Category", j.category], [Gavel, "Area of law", j.type]];

  return (
    <div className="mx-auto flex max-w-350 flex-col gap-5">
      <nav className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
        <Link href="/ai-analysis" className="hover:text-brand">AI Analysis</Link><ChevronRight size={14} />
        <Link href="/case-reference" className="hover:text-brand">Judgments</Link><ChevronRight size={14} />
        <span className="max-w-xs truncate text-ink">{j.title}</span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-sky-600"><Scale size={28} /></span>
          <div>
            <div className="flex flex-wrap items-center gap-3"><h1 className="text-3xl font-bold">{j.title}</h1><Badge className={caseTypeStyles[j.type]}>{j.type}</Badge></div>
            <p className="mt-1 text-sm text-slate-600">{j.cite} <span className="mx-1 text-slate-300">|</span> {j.court}</p>
          </div>
        </div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <button onClick={() => history.back()} className={outline}><ArrowLeft size={16} /> Back</button>
          <button onClick={copy} className={outline}><Copy size={16} /> Copy citation</button>
          <button onClick={() => act.attachReference({ title: j.title, text: `${j.title}, ${j.cite}` })} className={outline}><FolderPlus size={16} /> Attach to case</button>
          <button onClick={() => { s.toggleSaved(j.id); toast(saved ? "Removed from saved" : "Judgment saved"); }} className="flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark">
            <Bookmark size={16} className={saved ? "fill-white" : ""} /> {saved ? "Saved" : "Save judgment"}
          </button>
        </div>
      </div>

      <div className="stagger grid grid-cols-2 gap-4 xl:grid-cols-4">
        {facts.map(([Icon, k, v]) => (
          <div key={k} className="lift flex items-center gap-3 rounded-xl border border-line bg-white p-4 shadow-sm">
            <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-600"><Icon size={20} /></span>
            <div className="min-w-0"><p className="text-xs text-slate-500">{k}</p><p className="truncate font-semibold">{v}</p></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[1.6fr_1fr]">
        <div className="flex flex-col gap-5">
          <section className="rounded-xl border border-line bg-white p-4 shadow-sm sm:p-6">
            <div className="mb-4 flex flex-wrap items-center gap-4">
              <h2 className="text-lg font-bold">Key holding</h2>
              <span className={`rounded-md px-3 py-1 text-xs font-medium ${relevanceBadge[j.relevance]}`}>{j.relevance}</span>
              <span className="ml-auto flex items-center gap-3 text-sm"><b>{j.score}%</b> <span className="text-slate-500">match</span><span className="flex w-32"><Bar pct={j.score} color={matchColor(j.score)} height="h-2" /></span></span>
            </div>
            <blockquote className="rounded-xl border-l-4 border-brand bg-orange-50/50 p-5 text-base leading-relaxed text-slate-700">{j.excerpt}</blockquote>
          </section>

          <section className="rounded-xl border border-line bg-white p-4 shadow-sm sm:p-6">
            <h2 className="mb-3 text-lg font-bold">Why it matches your case</h2>
            <ul className="space-y-3 text-sm text-slate-600">
              {[`Same subject matter (${j.category.toLowerCase()}) decided by the ${j.court}.`, "The reasoning addresses the same statutory provisions and the same kind of evidence.", "Useful as supporting authority; confirm the full text and subsequent history before citing in court."].map((t) => (
                <li key={t} className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />{t}</li>
              ))}
            </ul>
            <p className="mt-5 rounded-lg bg-slate-50 px-4 py-3 text-xs text-slate-500">Demo content: judgment details on this page are illustrative samples, not real law reports.</p>
          </section>

          <section className="rounded-xl border border-line bg-white p-4 shadow-sm sm:p-6">
            <h2 className="mb-3 text-lg font-bold">Statutes relied on</h2>
            <ul className="divide-y divide-line">
              {laws.map((l) => (
                <li key={l.title} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-purple-50 text-purple-600"><Landmark size={19} /></span>
                  <div className="text-sm leading-relaxed"><p className="font-semibold">{l.title}</p><p className="text-slate-500">{l.note}</p><p className="mt-1 text-slate-600">{l.detail}</p></div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="flex flex-col gap-5">
          <section className="rounded-xl border border-line bg-white p-5 shadow-sm">
            <h2 className="mb-3 font-bold">More in {j.type.toLowerCase()} law</h2>
            <ul className="divide-y divide-line">
              {related.map((r) => (
                <li key={r.id}>
                  <Link href={`/ai-analysis/judgment/${r.id}`} className="block py-3 hover:text-brand">
                    <p className="text-sm font-semibold">{r.title}</p>
                    <p className="text-xs text-slate-500">{r.cite}</p>
                  </Link>
                </li>
              ))}
            </ul>
            <Link href="/case-reference" className="mt-3 block text-sm font-medium text-brand">Browse the full library</Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
