"use client";

import { useState } from "react";
import Link from "next/link";
import { FileText, RefreshCw, HelpCircle, Plus, ChevronRight, BookOpen, CircleCheck, CircleX, Sparkles, X, Maximize2 } from "lucide-react";

const card = "lift rounded-xl border border-line bg-white p-5 shadow-sm";

const Head = ({ icon: Icon, tint, title, action }) => (
  <div className="mb-4 flex items-center justify-between gap-3">
    <h2 className="flex items-center gap-3 font-bold">
      <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${tint}`}><Icon size={17} /></span>
      {title}
    </h2>
    {action}
  </div>
);

export function SummaryCard({ summary, onRegenerate, busy, reportHref }) {
  return (
    <section className={card}>
      <Head
        icon={FileText}
        tint="bg-blue-50 text-blue-600"
        title="AI Case Summary"
        action={
          <div className="flex items-center gap-2">
            <Link href={`${reportHref}#summary`} className="flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"><Maximize2 size={13} /> Full summary</Link>
            <button onClick={onRegenerate} disabled={busy} className="flex items-center gap-1.5 rounded-md bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-600 hover:bg-sky-100 disabled:opacity-60">
              <RefreshCw size={13} className={busy ? "animate-spin" : ""} /> Regenerate
            </button>
          </div>
        }
      />
      <Link href={`${reportHref}#summary`} className={`group block rounded-lg bg-sky-50/60 p-4 text-sm leading-relaxed transition hover:bg-sky-50 ${busy ? "opacity-50" : ""}`}>
        <p className="mb-1 flex items-center justify-between font-semibold">Case Summary <span className="text-xs font-medium text-sky-600 opacity-0 transition group-hover:opacity-100">Open full page</span></p>
        <span className="line-clamp-5">{summary.text}</span>
      </Link>
      <dl className="mt-4 grid grid-cols-3 gap-x-4 gap-y-4 text-sm">
        {summary.facts.map(([k, v]) => (
          <div key={k}>
            <dt className="text-xs text-slate-500">{k}</dt>
            <dd className="mt-0.5 font-semibold">{k === "Status" ? <span className="rounded bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-600">{v}</span> : v}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function QuestionsCard({ questions }) {
  const [list, setList] = useState(questions);
  const [adding, setAdding] = useState(false);
  const [text, setText] = useState("");

  const add = (e) => {
    e.preventDefault();
    const q = text.trim();
    if (!q) return;
    setList((l) => [...l, { q, a: "No answer yet - run the Legal Questions analysis to get one." }]);
    setText("");
    setAdding(false);
  };

  return (
    <section className={card}>
      <Head icon={HelpCircle} tint="bg-indigo-50 text-indigo-600" title="Key Legal Questions" action={<button onClick={() => setAdding(!adding)} className="flex items-center gap-1.5 rounded-md border border-line px-3 py-1.5 text-xs font-medium hover:bg-slate-50"><Plus size={13} /> Add Question</button>} />
      {adding && (
        <form onSubmit={add} className="anim-drop mb-3 flex gap-2">
          <input autoFocus value={text} onChange={(e) => setText(e.target.value)} placeholder="Type a legal question..." className="h-10 min-w-0 flex-1 rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand" />
          <button className="rounded-lg bg-brand px-4 text-sm font-semibold text-white">Add</button>
        </form>
      )}
      <ul className="divide-y divide-line">
        {list.length === 0 && <li className="py-6 text-center text-sm text-slate-500">No questions yet.</li>}
        {list.map((x, i) => (
          <li key={x.q} className="group flex items-center gap-3 py-3 text-sm">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-50 text-xs font-medium text-indigo-600">{i + 1}</span>
            <span className="flex-1 leading-snug">{x.q}</span>
            <button onClick={() => setList((l) => l.filter((_, j) => j !== i))} aria-label="Remove question" className="text-slate-300 hover:text-red-500"><X size={16} /></button>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function LawsCard({ laws, reportHref }) {
  return (
    <section className={card}>
      <Head icon={BookOpen} tint="bg-orange-50 text-orange-500" title="Applicable Laws & Sections" />
      <ul className="divide-y divide-line">
        {laws.map((l, i) => (
          <li key={l.title}>
            <Link href={`${reportHref}#laws`} className="flex w-full items-center gap-3 py-3 text-left hover:bg-slate-50">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-50 text-blue-600">{i === laws.length - 1 ? <BookOpen size={16} /> : <FileText size={16} />}</span>
              <span className="flex-1 text-sm leading-snug"><span className="block font-semibold">{l.title}</span><span className="block text-xs text-slate-500">{l.note}</span></span>
              <ChevronRight size={16} className="text-slate-500" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function ProsConsCard({ strengths, weaknesses, reportHref }) {
  return (
    <section className="lift rounded-xl border border-orange-200 bg-orange-50/60 p-5">
      <Head icon={Sparkles} tint="bg-orange-100 text-orange-500" title="AI Analysis (Pros & Cons)" action={<Link href={`${reportHref}#position`} className="rounded-md bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-600 hover:bg-sky-100">View Full Analysis</Link>} />
      <div className="grid grid-cols-2 gap-5 text-sm">
        <div>
          <p className="mb-3 font-semibold">Strengths (For Defense)</p>
          <ul className="space-y-2.5">{strengths.map((s) => <li key={s} className="flex items-start gap-2 text-xs"><CircleCheck size={16} className="shrink-0 fill-emerald-500 text-white" />{s}</li>)}</ul>
        </div>
        <div>
          <p className="mb-3 font-semibold">Weaknesses</p>
          <ul className="space-y-2.5">{weaknesses.map((s) => <li key={s} className="flex items-start gap-2 text-xs"><CircleX size={16} className="shrink-0 fill-red-500 text-white" />{s}</li>)}</ul>
        </div>
      </div>
    </section>
  );
}
