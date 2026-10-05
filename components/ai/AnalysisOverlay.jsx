"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, X, FileText, Sparkles, ArrowRight } from "lucide-react";
import { formatDate } from "@/lib/cases";

const STEPS = [
  { label: "Reading documents", ms: 1400 },
  { label: "Extracting parties, dates and sections", ms: 1500 },
  { label: "Searching the judgments database", ms: 1900 },
  { label: "Ranking relevant authorities", ms: 1200 },
  { label: "Drafting summary and position", ms: 1300 },
];
const TOTAL = STEPS.reduce((a, s) => a + s.ms, 0);
const STARTS = STEPS.map((_, i) => STEPS.slice(0, i).reduce((a, s) => a + s.ms, 0));
const LINES = [92, 78, 100, 64, 88, 96, 55, 82, 100, 70, 90, 48];
const DB_SIZE = 12480;

function Metric({ label, value }) {
  return (
    <div className="rounded-xl border border-line bg-slate-50 px-4 py-3">
      <p className="text-xl font-bold tabular-nums">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

export default function AnalysisOverlay({ caseData, files, matches, typeLabel, onDone, onReport, onCancel }) {
  const [t, setT] = useState(0);
  const [stay, setStay] = useState(false); // user chose to stay on the analysis page
  const [count, setCount] = useState(2); // seconds until the full report opens by itself
  const finished = t >= TOTAL;
  const cb = useRef({ onDone, onCancel, onReport });
  cb.current = { onDone, onCancel, onReport }; // latest callbacks without restarting the animation

  useEffect(() => {
    const t0 = performance.now();
    let frame;
    const tick = (now) => {
      const elapsed = Math.min(TOTAL, now - t0);
      setT(elapsed);
      if (elapsed < TOTAL) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    const onKey = (e) => e.key === "Escape" && (t >= TOTAL ? cb.current.onDone() : cb.current.onCancel());
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // once the analysis is complete, open the full-page report automatically
  useEffect(() => {
    if (!finished || stay) return;
    if (count <= 0) { cb.current.onReport(); return; }
    const id = setTimeout(() => setCount((c) => c - 1), 800);
    return () => clearTimeout(id);
  }, [finished, stay, count]);

  const entities = useMemo(
    () =>
      [
        caseData.sections && caseData.sections !== "-" && ["Section", caseData.sections],
        caseData.firNo && caseData.firNo !== "-" && ["FIR", caseData.firNo],
        ["Court", caseData.court],
        ["Filed", formatDate(caseData.filed)],
        ["Client", caseData.client],
        ["Case no.", caseData.caseNo],
      ].filter(Boolean),
    [caseData]
  );

  const active = finished ? STEPS.length : STARTS.filter((s) => t >= s).length - 1;
  const within = (i) => Math.max(0, Math.min(1, (t - STARTS[i]) / STEPS[i].ms));
  const pct = Math.round((t / TOTAL) * 100);
  const names = files.map((f) => f.name);
  const fileIdx = finished || active > 0 ? names.length - 1 : Math.min(names.length - 1, Math.floor(within(0) * names.length));
  const docsRead = finished || active > 0 ? names.length : Math.floor(within(0) * names.length);
  const shownEntities = finished || active > 1 ? entities.length : active === 1 ? Math.floor(within(1) * entities.length) : 0;
  const judgments = finished || active > 2 ? DB_SIZE : active === 2 ? Math.round(within(2) * DB_SIZE) : 0;
  const scanned = finished || active > 1 ? LINES.length : Math.floor(Math.min(1, t / STARTS[2]) * LINES.length);
  const remaining = Math.max(1, Math.ceil((TOTAL - t) / 1000));

  const sub = [
    names.length ? `${Math.min(names.length, docsRead + (docsRead < names.length ? 1 : 0))} of ${names.length}: ${names[fileIdx]}` : "No files selected",
    `${shownEntities} of ${entities.length} entities found`,
    `${judgments.toLocaleString("en-IN")} of ${DB_SIZE.toLocaleString("en-IN")} judgments scanned`,
    finished || active > 3 ? `${matches} authorities ranked` : "Scoring relevance",
    "Composing the report",
  ];

  return createPortal(
    <div className="anim-fade fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-slate-900/45 p-3 backdrop-blur-sm sm:items-center sm:p-4">
      <div role="dialog" aria-modal="true" aria-label="AI analysis in progress" className="anim-pop relative my-auto w-full max-w-3xl overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="h-1 w-full bg-slate-100">
          <div className="h-full bg-linear-to-r from-brand via-orange-400 to-pink-400 transition-[width] duration-150" style={{ width: `${pct}%` }} />
        </div>

        {finished && !stay && <div className="h-0.5 w-full bg-emerald-100"><div className="h-full bg-emerald-500 transition-[width] duration-700 ease-linear" style={{ width: `${((2 - count) / 2) * 100}%` }} /></div>}

        <header className="flex items-start justify-between gap-4 px-4 pb-3 pt-4 sm:px-6 sm:pb-4 sm:pt-5">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-brand"><Sparkles size={12} /> AI analysis &middot; {typeLabel}</p>
            <h2 className="mt-1 text-xl font-bold">{finished ? "Analysis complete" : "Analysing case"}</h2>
            <p className="truncate text-sm text-slate-500">{caseData.title} &middot; {caseData.caseNo}</p>
          </div>
          <button onClick={finished ? () => { setStay(true); onDone(); } : onCancel} aria-label={finished ? "Close" : "Cancel analysis"} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-ink"><X size={18} /></button>
        </header>

        <div className="grid gap-5 px-4 pb-5 sm:px-6 sm:pb-6 md:grid-cols-[1.05fr_1fr] md:gap-6">
          {/* document scan */}
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs text-slate-500">
              <FileText size={14} /> <span className="truncate font-medium text-slate-700">{names[fileIdx] ?? "Case file"}</span>
              {names.length > 1 && <span className="ml-auto rounded bg-slate-100 px-1.5 py-0.5">{fileIdx + 1} / {names.length}</span>}
            </div>
            <div className="relative h-44 overflow-hidden rounded-xl border border-line bg-slate-50 p-4 sm:h-56 sm:p-5">
              <div className="mx-auto flex h-full max-w-xs flex-col justify-between rounded bg-white p-4 shadow-sm">
                <div className="mb-1 h-2.5 w-1/2 rounded bg-slate-300" />
                {LINES.map((w, i) => (
                  <div key={i} className={`h-1.5 rounded transition-colors duration-500 ${i < scanned ? "bg-orange-200" : "bg-slate-200"}`} style={{ width: `${w}%` }} />
                ))}
              </div>
              {!finished && <div className="scan-band pointer-events-none absolute inset-x-0 h-12 border-b-2 border-brand/60 bg-linear-to-b from-transparent to-brand/15" />}
            </div>
            <div className="mt-3 flex min-h-16 flex-wrap content-start gap-1.5">
              {entities.slice(0, shownEntities).map(([k, v]) => (
                <span key={k} className="anim-pop flex items-center gap-1.5 rounded-full border border-line bg-white px-2.5 py-1 text-xs"><span className="text-slate-400">{k}</span><b className="max-w-36 truncate font-semibold">{v}</b></span>
              ))}
              {shownEntities === 0 && <span className="text-xs text-slate-400">Extracted details will appear here...</span>}
            </div>
          </div>

          {/* progress */}
          <div>
            <ol>
              {STEPS.map((s, i) => {
                const state = finished || i < active ? "done" : i === active ? "active" : "todo";
                return (
                  <li key={s.label} className="relative flex gap-3 pb-4 last:pb-0">
                    {i < STEPS.length - 1 && <span className={`absolute left-3 top-7 h-[calc(100%-1.25rem)] w-px ${state === "done" ? "bg-emerald-300" : "bg-line"}`} />}
                    <span className="relative z-10 flex h-6 w-6 shrink-0 items-center justify-center">
                      {state === "done" ? <span className="anim-pop-check flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-white"><Check size={13} strokeWidth={3} /></span>
                        : state === "active" ? <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-brand/30"><span className="h-2.5 w-2.5 animate-pulse rounded-full bg-brand" /></span>
                        : <span className="h-6 w-6 rounded-full border-2 border-line bg-white" />}
                    </span>
                    <div className={`min-w-0 flex-1 transition-opacity ${state === "todo" ? "opacity-40" : ""}`}>
                      <p className={`text-sm ${state === "active" ? "font-semibold" : "font-medium"}`}>{s.label}</p>
                      {state !== "todo" && <p className="truncate text-xs text-slate-500">{sub[i]}</p>}
                      {state === "active" && (
                        <div className="relative mt-1.5 h-1 overflow-hidden rounded-full bg-slate-100"><div className="indeterminate absolute inset-y-0 w-2/5 rounded-full bg-brand/70" /></div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
            <div className="mt-5 grid grid-cols-3 gap-3">
              <Metric label="Documents" value={`${docsRead}/${names.length}`} />
              <Metric label="Entities" value={shownEntities} />
              <Metric label="Authorities" value={finished || active > 3 ? matches : "-"} />
            </div>
          </div>
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line bg-slate-50/70 px-4 py-3 sm:px-6 sm:py-4">
          <p className="text-sm text-slate-500">
            {finished ? <>Completed in <b className="text-ink">{(TOTAL / 1000).toFixed(1)}s</b> &middot; {matches} similar judgments found{!stay && <span className="ml-1 text-brand">&middot; opening your report...</span>}</> : <>{pct}% &middot; about {remaining}s remaining</>}
          </p>
          {finished ? (
            <div className="flex w-full gap-2 sm:w-auto [&>button]:flex-1 sm:[&>button]:flex-none">
              <button onClick={() => { setStay(true); onDone(); }} className="rounded-lg border border-line bg-white px-5 py-2.5 text-sm font-medium hover:bg-slate-50">Stay here</button>
              <button autoFocus onClick={() => { setStay(true); onReport(); }} className="anim-pop flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark">Open full report <ArrowRight size={16} /></button>
            </div>
          ) : (
            <button onClick={onCancel} className="rounded-lg border border-line bg-white px-5 py-2.5 text-sm font-medium hover:bg-slate-50">Cancel</button>
          )}
        </footer>
      </div>
    </div>,
    document.body
  );
}
