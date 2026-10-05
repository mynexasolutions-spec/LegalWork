"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, MessageSquare, FileText, Scale, BookOpen, Sparkles, ArrowRight, Download, Info } from "lucide-react";
import CaseSelector from "./CaseSelector";
import SimilarCases from "./SimilarCases";
import AnalysisOverlay from "./AnalysisOverlay";
import OcrPanel from "./OcrPanel";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/ui/Toast";
import { analysisFor, reportLines } from "@/lib/aiData";
import { makeDemoPdf } from "@/lib/files";
import { downloadBlob, formatSize } from "@/lib/format";
import { formatDate } from "@/lib/cases";

const TYPES = [
  { id: "similar", title: "Similar Cases", note: "Find relevant judgments", icon: Search, tint: "bg-orange-50 text-orange-500" },
  { id: "legal", title: "Legal Questions", note: "Ask specific questions", icon: MessageSquare, tint: "bg-blue-50 text-blue-600" },
  { id: "summary", title: "Case Summary", note: "Get AI summary", icon: FileText, tint: "bg-purple-50 text-purple-600" },
  { id: "strength", title: "Strength & Weakness", note: "Pros and cons analysis", icon: Scale, tint: "bg-orange-50 text-orange-500" },
  { id: "laws", title: "Applicable Laws", note: "Relevant acts & sections", icon: BookOpen, tint: "bg-purple-50 text-purple-600" },
];

const SECTION = { legal: "questions", summary: "summary", strength: "position", laws: "laws", similar: "judgments" };
const stamp = () => new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });

export default function AiView() {
  const s = useStore();
  const toast = useToast();
  const router = useRouter();
  const firstCase = s.cases.find((c) => c.caseNo === "CR/2026/145") ?? s.cases[0];
  const [caseNo, setCaseNo] = useState(firstCase?.caseNo ?? "");
  const [files, setFiles] = useState([]);
  const [type, setType] = useState("similar");
  const [shown, setShown] = useState("similar");
  const [running, setRunning] = useState(null); // type being generated, or null
  const [at, setAt] = useState(null);
  const [rev, setRev] = useState(0);

  const c = s.cases.find((x) => x.caseNo === caseNo) ?? s.cases[0];
  const docs = useMemo(() => s.documents.filter((d) => d.caseNo === c?.caseNo && !d.trashed).sort((a, b) => b.ts.localeCompare(a.ts)), [s.documents, c]);
  const hearings = useMemo(() => s.hearings.filter((h) => h.caseNo === c?.caseNo), [s.hearings, c]);

  // the file list follows the chosen case (first two documents ticked)
  useEffect(() => {
    setFiles(docs.map((d, i) => ({ id: d.id, name: d.name, size: formatSize(d.sizeKb), kind: d.kind, checked: i < 2 })));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [c?.caseNo, docs.length]);

  const analysis = useMemo(() => (c ? analysisFor(c, hearings, docs) : null), [c, hearings, docs]);
  const picked = files.filter((f) => f.checked);

  const run = useCallback((t) => {
    setRunning(t);
    if (c) router.prefetch(`/ai-analysis/report/${c.id}`); // warm the report route while the analysis plays
  }, [c, router]);
  const finish = useCallback((openReport = false) => {
    setShown(running);
    setType(running);
    setAt(stamp());
    setRev((r) => r + 1);
    if (openReport && c) {
      router.push(`/ai-analysis/report/${c.id}`); // the overlay stays up until the report page replaces this one
      return;
    }
    setRunning(null);
    toast(`Analysis ready for ${c?.title}`);
  }, [running, c, toast, router]);

  const download = () => {
    const blob = makeDemoPdf(`AI Analysis - ${c.title}`, reportLines(c, analysis));
    downloadBlob(blob, `analysis-${c.caseNo.replaceAll("/", "-")}.pdf`);
    toast("Report downloaded");
  };

  if (!c || !analysis) {
    return <div className="rounded-xl border border-line bg-white p-10 text-center text-slate-500">Add a case first, then come back to analyse it.</div>;
  }

  const reportHref = `/ai-analysis/report/${c.id}`;

  return (
    <div className="flex min-w-0 flex-col gap-5">
      <div className="flex min-w-0 flex-col gap-5">
        <section className="rounded-xl border border-line bg-white p-4 shadow-sm sm:p-5">
          <CaseSelector caseNo={c.caseNo} onCase={setCaseNo} files={files} setFiles={setFiles} />

          <div className="mt-6 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-bold">2. Choose Analysis Type</h2>
              <p className="text-sm text-slate-500">Select what you want to analyse</p>
            </div>
            <button
              onClick={() => run(type)}
              disabled={!!running || picked.length === 0}
              className="group relative flex h-12 w-full items-center justify-center gap-3 overflow-hidden rounded-lg bg-linear-to-r from-orange-400 to-pink-500 px-8 text-sm font-semibold text-white shadow-md shadow-orange-300/40 transition hover:shadow-lg hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50 sm:w-72"
            >
              <span className="absolute inset-y-0 -left-1/2 w-1/3 -skew-x-12 bg-white/25 transition-transform duration-700 group-hover:translate-x-[420%]" />
              <Sparkles size={17} className="relative" /> <span className="relative">Analyze</span> <ArrowRight size={17} className="relative transition-transform group-hover:translate-x-1" />
            </button>
          </div>
          {picked.length === 0 && <p className="mt-2 text-right text-xs text-red-600">Select at least one file to analyze.</p>}

          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
            {TYPES.map((t) => {
              const Icon = t.icon;
              const on = type === t.id;
              return (
                <button key={t.id} onClick={() => setType(t.id)} aria-pressed={on} className={`lift relative flex last:col-span-2 md:last:col-span-1 items-center gap-2.5 rounded-lg border p-3 text-left ${on ? "border-brand bg-orange-50" : "border-line hover:bg-slate-50"}`}>
                  {on && <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-brand" />}
                  <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${t.tint}`}><Icon size={18} /></span>
                  <span className="min-w-0 text-xs leading-tight"><span className="block text-[13px] font-semibold">{t.title}</span><span className="block truncate text-slate-500">{t.note}</span></span>
                </button>
              );
            })}
          </div>
        </section>

        <OcrPanel key={c.caseNo} caseData={c} />

        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-white px-4 py-3 text-sm shadow-sm sm:px-5">
          <Info size={16} className="text-slate-400" />
          <p className="min-w-0 flex-1 basis-full text-slate-600 sm:basis-0">
            {at ? <>Generated at <b>{at}</b> for </> : "Showing sample results for "}<b>{c.title}</b> ({picked.length} file{picked.length === 1 ? "" : "s"}). Demo output only.</p>
          <Link href={reportHref} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand px-4 py-2 text-xs font-semibold text-white hover:bg-brand-dark sm:flex-none"><FileText size={14} /> Open full report</Link>
          <button onClick={download} className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-line px-4 py-2 text-xs font-medium hover:bg-slate-50 sm:flex-none"><Download size={14} /> Download PDF</button>
        </div>

        <div key={rev} className="anim-page">
          {shown === "similar" ? (
            <SimilarCases key={c.caseNo} items={analysis.similar} />
          ) : (
            <section className="flex flex-col items-center gap-3 rounded-xl border border-line bg-white px-6 py-14 text-center shadow-sm">
              <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-brand"><FileText size={24} /></span>
              <h2 className="text-lg font-bold">{TYPES.find((x) => x.id === shown)?.title} is ready</h2>
              <p className="max-w-md text-sm text-slate-500">The summary, key questions, applicable laws and strengths &amp; weaknesses open on their own page.</p>
              <Link href={`${reportHref}#${SECTION[shown]}`} className="mt-1 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark">Open full report</Link>
            </section>
          )}
        </div>
      </div>

      {running && (
        <AnalysisOverlay
          caseData={c}
          files={picked}
          matches={analysis.similar.length}
          typeLabel={TYPES.find((x) => x.id === running)?.title}
          onDone={() => finish(false)}
          onReport={() => finish(true)}
          onCancel={() => setRunning(null)}
        />
      )}
    </div>
  );
}
