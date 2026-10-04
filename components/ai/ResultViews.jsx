"use client";

import { useState } from "react";
import { ChevronDown, MessageSquare, FileText, Scale, BookOpen, CircleCheck, CircleX } from "lucide-react";
import Bar from "@/components/ui/Bar";
import { formatDate } from "@/lib/cases";

const wrap = "rounded-xl border border-line bg-white p-5 shadow-sm";
const Title = ({ icon: Icon, tint, title, note }) => (
  <div className="mb-4 flex items-center gap-3">
    <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${tint}`}><Icon size={24} /></span>
    <div><h2 className="text-lg font-bold">{title}</h2><p className="text-sm text-slate-500">{note}</p></div>
  </div>
);

export function LegalQuestionsResult({ questions }) {
  const [open, setOpen] = useState(0);
  return (
    <section className={wrap}>
      <Title icon={MessageSquare} tint="bg-blue-50 text-blue-600" title="Legal Questions" note="AI answers to the key questions in this case" />
      <ul className="stagger space-y-3">
        {questions.map((x, i) => (
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
    </section>
  );
}

export function SummaryResult({ analysis, hearings, caseTitle }) {
  const past = hearings.filter((h) => h.status === "Completed").sort((a, b) => a.date.localeCompare(b.date));
  return (
    <section className={wrap}>
      <Title icon={FileText} tint="bg-purple-50 text-purple-600" title="Case Summary" note={caseTitle} />
      <p className="rounded-xl bg-sky-50/60 p-5 text-sm leading-relaxed">{analysis.summary.text}</p>
      <dl className="stagger mt-5 grid grid-cols-2 gap-4 md:grid-cols-3">
        {analysis.summary.facts.map(([k, v]) => (
          <div key={k} className="rounded-lg border border-line px-4 py-3"><dt className="text-xs text-slate-500">{k}</dt><dd className="mt-0.5 font-semibold">{v}</dd></div>
        ))}
      </dl>
      <h3 className="mb-3 mt-6 font-bold">How the case has moved</h3>
      {past.length === 0 ? <p className="text-sm text-slate-500">No completed hearings yet.</p> : (
        <ol className="relative ml-2 border-l border-line">
          {past.map((h) => (
            <li key={h.id} className="mb-4 ml-5 last:mb-0">
              <span className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full bg-emerald-500 ring-4 ring-white" />
              <p className="text-sm font-semibold">{h.purpose} <span className="font-normal text-slate-400">- {formatDate(h.date)}</span></p>
              {h.remarks && <p className="text-sm text-slate-500">{h.remarks}</p>}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export function StrengthResult({ analysis }) {
  const { strengths, weaknesses } = analysis;
  const score = Math.round((strengths.length / (strengths.length + weaknesses.length)) * 100);
  const label = score >= 60 ? "Favourable" : score >= 45 ? "Balanced" : "Challenging";
  return (
    <section className={wrap}>
      <Title icon={Scale} tint="bg-orange-50 text-orange-500" title="Strength & Weakness" note="Pros and cons of the defence position" />
      <div className="mb-5 flex items-center gap-4 rounded-xl bg-slate-50 px-5 py-4">
        <div><p className="text-xs text-slate-500">Overall position</p><p className="text-xl font-bold">{label}</p></div>
        <div className="flex-1"><Bar pct={score} color="bg-emerald-500" track="bg-red-200" height="h-2.5" /></div>
        <p className="text-sm font-semibold">{score}% in favour</p>
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4">
          <h3 className="mb-3 font-bold text-emerald-700">Strengths</h3>
          <ul className="space-y-3">{strengths.map((s) => <li key={s} className="flex items-start gap-2.5 text-sm"><CircleCheck size={18} className="shrink-0 fill-emerald-500 text-white" />{s}</li>)}</ul>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50/40 p-4">
          <h3 className="mb-3 font-bold text-red-700">Weaknesses</h3>
          <ul className="space-y-3">{weaknesses.map((s) => <li key={s} className="flex items-start gap-2.5 text-sm"><CircleX size={18} className="shrink-0 fill-red-500 text-white" />{s}</li>)}</ul>
        </div>
      </div>
    </section>
  );
}

export function LawsResult({ laws }) {
  return (
    <section className={wrap}>
      <Title icon={BookOpen} tint="bg-purple-50 text-purple-600" title="Applicable Laws" note="Relevant acts and sections for this case" />
      <ul className="stagger space-y-3">
        {laws.map((l) => (
          <li key={l.title} className="rounded-xl border border-line p-4">
            <p className="font-bold">{l.title}</p>
            <p className="text-sm text-slate-500">{l.note}</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-700">{l.detail}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
