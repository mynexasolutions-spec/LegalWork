"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, Download, Printer, ArrowLeft, FileText, HelpCircle, Landmark, Scale, BookOpen, CalendarDays, CircleCheck, CircleX, ChevronDown, Sparkles } from "lucide-react";
import Badge from "@/components/Badge";
import Bar from "@/components/ui/Bar";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/ui/Toast";
import { analysisFor, reportLines, relevanceBadge } from "@/lib/aiData";
import { makeDemoPdf } from "@/lib/files";
import { downloadBlob, isoOf } from "@/lib/format";
import { formatDate } from "@/lib/cases";
import { statusStyles, caseTypeStyles } from "@/lib/data";

const SECTIONS = [
  ["summary", "Summary", FileText],
  ["questions", "Key questions", HelpCircle],
  ["laws", "Applicable laws", Landmark],
  ["position", "Strengths & weaknesses", Scale],
  ["judgments", "Similar judgments", BookOpen],
  ["timeline", "Timeline", CalendarDays],
];

const Section = ({ id, icon: Icon, title, children }) => (
  <section id={id} className="scroll-mt-32 rounded-xl border border-line bg-white p-4 shadow-sm sm:p-6 xl:scroll-mt-24">
    <h2 className="mb-4 flex items-center gap-3 text-lg font-bold"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 text-brand"><Icon size={18} /></span>{title}</h2>
    {children}
  </section>
);

export default function ReportPage({ slug }) {
  const s = useStore();
  const toast = useToast();
  const [open, setOpen] = useState(0);
  const [active, setActive] = useState("summary");
  const c = s.cases.find((x) => x.id === slug);
  const hearings = useMemo(() => (c ? s.hearings.filter((h) => h.caseNo === c.caseNo).sort((a, b) => b.date.localeCompare(a.date)) : []), [s.hearings, c]);
  const docs = useMemo(() => (c ? s.documents.filter((d) => d.caseNo === c.caseNo && !d.trashed) : []), [s.documents, c]);
  const a = useMemo(() => (c ? analysisFor(c, hearings, docs) : null), [c, hearings, docs]);

  useEffect(() => { document.title = c ? `AI Report - ${c.title} - LexPro` : "Report not found - LexPro"; }, [c]);

  // highlight the section currently in view in the side navigation
  useEffect(() => {
    if (!c) return;
    const io = new IntersectionObserver((entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)), { rootMargin: "-20% 0px -65% 0px" });
    SECTIONS.forEach(([id]) => { const el = document.getElementById(id); if (el) io.observe(el); });
    return () => io.disconnect();
  }, [c]);

  if (!c || !a) {
    return (
      <div className="mx-auto max-w-3xl pt-10">
        <div className="flex flex-col items-center gap-3 rounded-xl border border-line bg-white py-16 text-slate-500 shadow-sm">
          <Sparkles size={32} strokeWidth={1.5} />
          <p className="text-sm">No case found for this report.</p>
          <Link href="/ai-analysis" className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white">Back to AI Analysis</Link>
        </div>
      </div>
    );
  }

  const score = Math.round((a.strengths.length / (a.strengths.length + a.weaknesses.length)) * 100);
  const position = score >= 60 ? "Favourable" : score >= 45 ? "Balanced" : "Challenging";
  const download = () => {
    downloadBlob(makeDemoPdf(`AI Analysis - ${c.title}`, reportLines(c, a)), `analysis-${c.caseNo.replaceAll("/", "-")}.pdf`);
    toast("Report downloaded");
  };
  const go = (id) => { setActive(id); document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }); };
  const outline = "flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-medium hover:bg-slate-50";

  return (
    <div className="mx-auto flex max-w-350 flex-col gap-5">
      <nav className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
        <Link href="/ai-analysis" className="hover:text-brand">AI Analysis</Link><ChevronRight size={14} /><span>Report</span><ChevronRight size={14} /><span className="max-w-xs truncate text-ink">{c.title}</span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-purple-600 text-white"><Sparkles size={26} /></span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-purple-600">AI analysis report</p>
            <div className="flex flex-wrap items-center gap-3"><h1 className="text-3xl font-bold">{c.title}</h1><Badge className={statusStyles[c.status]}>{c.status}</Badge><Badge className={caseTypeStyles[c.type]}>{c.type}</Badge></div>
            <p className="mt-1 text-sm text-slate-600">{c.caseNo} &bull; {c.court} &bull; generated {formatDate(isoOf(new Date()))}</p>
          </div>
        </div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <Link href="/ai-analysis" className={outline}><ArrowLeft size={16} /> Back to analysis</Link>
          <button onClick={() => window.print()} className={outline}><Printer size={16} /> Print</button>
          <button onClick={download} className="flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"><Download size={16} /> Download PDF</button>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[210px_1fr]">
        <nav aria-label="Report sections" className="sticky top-24 hidden rounded-xl border border-line bg-white p-2 shadow-sm xl:block">
          {SECTIONS.map(([id, label, Icon]) => (
            <button key={id} onClick={() => go(id)} className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm transition ${active === id ? "bg-peach font-semibold text-sidebar" : "text-slate-600 hover:bg-slate-50"}`}><Icon size={16} /> {label}</button>
          ))}
        </nav>

        <div className="stagger flex min-w-0 flex-col gap-5">
          <div className="sticky top-17 z-10 -mx-4 flex gap-2 overflow-x-auto bg-canvas/95 px-4 py-2 backdrop-blur sm:-mx-6 sm:px-6 xl:hidden">
            {SECTIONS.map(([id, label]) => (
              <button key={id} onClick={() => go(id)} className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium ${active === id ? "border-brand bg-peach text-sidebar" : "border-line bg-white text-slate-600"}`}>{label}</button>
            ))}
          </div>
          <Section id="summary" icon={FileText} title="Summary">
            <p className="rounded-xl bg-sky-50/60 p-5 text-base leading-relaxed text-slate-700">{a.summary.text}</p>
            <dl className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3">
              {a.summary.facts.map(([k, v]) => (
                <div key={k} className="rounded-lg border border-line px-4 py-3"><dt className="text-xs text-slate-500">{k}</dt><dd className="mt-0.5 font-semibold">{v}</dd></div>
              ))}
            </dl>
            <div className="mt-5 grid grid-cols-3 gap-4 text-center">
              {[[a.questions.length, "Key questions"], [a.laws.length, "Applicable laws"], [a.similar.length, "Similar judgments"]].map(([n, l]) => (
                <div key={l} className="rounded-xl bg-slate-50 py-4"><p className="text-2xl font-bold">{n}</p><p className="text-xs text-slate-500">{l}</p></div>
              ))}
            </div>
          </Section>

          <Section id="questions" icon={HelpCircle} title="Key legal questions">
            <ul className="space-y-3">
              {a.questions.map((x, i) => (
                <li key={x.q} className="rounded-xl border border-line">
                  <button onClick={() => setOpen(open === i ? -1 : i)} aria-expanded={open === i} className="flex w-full items-center gap-3 px-4 py-3.5 text-left">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-medium text-indigo-600">{i + 1}</span>
                    <span className="flex-1 text-sm font-semibold">{x.q}</span>
                    <ChevronDown size={16} className={`text-slate-500 transition-transform ${open === i ? "rotate-180" : ""}`} />
                  </button>
                  {open === i && <p className="anim-fade border-t border-line px-4 py-4 pl-14 text-sm leading-relaxed text-slate-700">{x.a}</p>}
                </li>
              ))}
            </ul>
          </Section>

          <Section id="laws" icon={Landmark} title="Applicable laws & sections">
            <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {a.laws.map((l) => (
                <li key={l.title} className="rounded-xl border border-line p-4"><p className="font-bold">{l.title}</p><p className="text-sm text-slate-500">{l.note}</p><p className="mt-2 text-sm leading-relaxed text-slate-700">{l.detail}</p></li>
              ))}
            </ul>
          </Section>

          <Section id="position" icon={Scale} title="Strengths & weaknesses">
            <div className="mb-5 flex items-center gap-4 rounded-xl bg-slate-50 px-5 py-4">
              <div><p className="text-xs text-slate-500">Overall position</p><p className="text-xl font-bold">{position}</p></div>
              <div className="flex flex-1"><Bar pct={score} color="bg-emerald-500" track="bg-red-200" height="h-2.5" /></div>
              <p className="text-sm font-semibold">{score}% in favour</p>
            </div>
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4"><h3 className="mb-3 font-bold text-emerald-700">Strengths</h3><ul className="space-y-3">{a.strengths.map((t) => <li key={t} className="flex items-start gap-2.5 text-sm"><CircleCheck size={18} className="shrink-0 fill-emerald-500 text-white" />{t}</li>)}</ul></div>
              <div className="rounded-xl border border-red-200 bg-red-50/40 p-4"><h3 className="mb-3 font-bold text-red-700">Weaknesses</h3><ul className="space-y-3">{a.weaknesses.map((t) => <li key={t} className="flex items-start gap-2.5 text-sm"><CircleX size={18} className="shrink-0 fill-red-500 text-white" />{t}</li>)}</ul></div>
            </div>
          </Section>

          <Section id="judgments" icon={BookOpen} title="Similar judgments">
            <ul className="divide-y divide-line">
              {a.similar.slice(0, 6).map((j) => (
                <li key={j.id} className="flex flex-wrap items-center gap-4 py-3.5 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1"><Link href={`/ai-analysis/judgment/${j.id}`} className="font-semibold hover:text-brand">{j.title}</Link><p className="text-xs text-slate-500">{j.cite} | {j.court}</p></div>
                  <span className={`rounded-md px-3 py-1 text-xs font-medium ${relevanceBadge[j.relevance]}`}>{j.relevance}</span>
                  <span className="w-12 text-right text-sm font-bold">{j.score}%</span>
                </li>
              ))}
            </ul>
          </Section>

          <Section id="timeline" icon={CalendarDays} title="Case timeline">
            {hearings.length === 0 ? <p className="text-sm text-slate-500">No hearings recorded yet.</p> : (
              <ol className="relative ml-2 border-l border-line">
                {hearings.map((h) => (
                  <li key={h.id} className="mb-4 ml-5 last:mb-0">
                    <span className={`absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full ring-4 ring-white ${h.status === "Completed" ? "bg-emerald-500" : h.status === "Scheduled" ? "bg-orange-500" : "bg-slate-300"}`} />
                    <p className="text-sm font-semibold">{h.purpose} <span className="font-normal text-slate-400">- {formatDate(h.date)}, {h.time}</span></p>
                    <p className="text-xs text-slate-500">{h.status}{h.remarks ? ` - ${h.remarks}` : ""}</p>
                  </li>
                ))}
              </ol>
            )}
          </Section>

          <p className="rounded-lg bg-slate-50 px-4 py-3 text-xs text-slate-500">Demo output: this report is generated from sample data and is not legal advice.</p>
        </div>
      </div>
    </div>
  );
}
