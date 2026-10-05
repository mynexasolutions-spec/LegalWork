"use client";

import { useEffect, useRef, useState } from "react";
import { ScanText, Upload, Copy, Download, FolderPlus, X, Check, Loader2, FileText } from "lucide-react";
import Bar from "@/components/ui/Bar";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/ui/Toast";
import { downloadBlob, formatSize, kindOf } from "@/lib/format";

const STAGES = ["Preparing image", "Detecting text regions", "Recognising characters", "Cleaning up text"];
const DURATION = 3600;
const LANGS = ["English", "Hindi", "English + Hindi"];
const stamp = () => new Date().toLocaleString("en-GB", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: true });

// Demo only: there is no OCR engine behind this, the text below is sample output for the chosen case.
function sampleText(c, lang) {
  const en = [
    "FIRST INFORMATION REPORT",
    "(Under Section 154 Cr.P.C.)",
    "",
    `1. District            : Lucknow`,
    `2. Police Station      : Hazratganj`,
    `3. FIR No.             : ${c.firNo && c.firNo !== "-" ? c.firNo : "0123/2026"}`,
    `4. Date and time       : 10.01.2026, 06:40 PM`,
    `5. Complainant         : ${c.client}`,
    `6. Acts and sections   : ${c.sections && c.sections !== "-" ? c.sections : "379 IPC"}`,
    "",
    "Details of the incident:",
    `${c.description}`,
    "",
    "Action taken: Case registered and investigation entrusted to the Sub-Inspector.",
  ];
  const hi = ["प्रथम सूचना रिपोर्ट", "(धारा 154 दं.प्र.सं. के अंतर्गत)", `शिकायतकर्ता : ${c.client}`, `न्यायालय : ${c.court}`, `मामला : ${c.subtitle}`];
  return lang === "Hindi" ? hi.join("\n") : lang === "English + Hindi" ? [...en, "", ...hi].join("\n") : en.join("\n");
}

export default function OcrPanel({ caseData }) {
  const s = useStore();
  const toast = useToast();
  const input = useRef(null);
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState(null);
  const [lang, setLang] = useState("English");
  const [t, setT] = useState(0);
  const [running, setRunning] = useState(false);
  const [text, setText] = useState("");
  const [over, setOver] = useState(false);
  const frame = useRef(null);

  useEffect(() => () => cancelAnimationFrame(frame.current), []);
  useEffect(() => () => url && URL.revokeObjectURL(url), [url]);

  const pick = (f) => {
    if (!f) return;
    if (!/^image\//.test(f.type) && !/\.pdf$/i.test(f.name)) return toast("Choose an image (JPG, PNG) or a PDF", "error");
    setFile(f);
    setText("");
    setT(0);
    setUrl(f.type.startsWith("image/") ? URL.createObjectURL(f) : null);
  };

  const run = () => {
    if (!file || running) return;
    setRunning(true);
    setText("");
    const t0 = performance.now();
    const tick = (now) => {
      const e = Math.min(DURATION, now - t0);
      setT(e);
      if (e < DURATION) frame.current = requestAnimationFrame(tick);
      else {
        setRunning(false);
        setText(sampleText(caseData, lang));
        toast("Text extracted");
      }
    };
    frame.current = requestAnimationFrame(tick);
  };

  const pct = Math.round((t / DURATION) * 100);
  const stage = Math.min(STAGES.length - 1, Math.floor((t / DURATION) * STAGES.length));
  const clear = () => { setFile(null); setUrl(null); setText(""); setT(0); setRunning(false); cancelAnimationFrame(frame.current); };

  const copy = async () => {
    try { await navigator.clipboard.writeText(text); toast("Text copied"); } catch { toast("Couldn't copy, select the text manually", "error"); }
  };
  const save = () => {
    s.addNote(`case:${caseData.caseNo}`, { by: "Harsh Kumar", at: stamp(), ts: new Date().toISOString(), text: `OCR text from ${file.name}:\n${text}` });
    toast("Saved to the case notes");
  };

  return (
    <section className="rounded-xl border border-line bg-white p-4 shadow-sm sm:p-5">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-sky-600"><ScanText size={24} /></span>
        <div className="min-w-0 flex-1 basis-48">
          <h2 className="text-lg font-bold">OCR - read scanned documents</h2>
          <p className="text-sm text-slate-500">Turn a photo or scan of a document into editable text.</p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-slate-500">Language</span>
          <select value={lang} onChange={(e) => setLang(e.target.value)} disabled={running} className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-sm outline-none focus:border-brand">
            {LANGS.map((l) => <option key={l}>{l}</option>)}
          </select>
        </label>
      </div>

      {!file ? (
        <div
          onClick={() => input.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setOver(true); }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => { e.preventDefault(); setOver(false); pick(e.dataTransfer.files[0]); }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && input.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-10 text-center transition ${over ? "border-brand bg-orange-50" : "border-slate-300 bg-slate-50 hover:bg-slate-100"}`}
        >
          <Upload size={28} strokeWidth={1.5} className="text-slate-600" />
          <p className="text-sm font-semibold">Drop a scan here, or click to choose</p>
          <p className="text-xs text-slate-500">JPG, PNG or PDF</p>
          <input ref={input} type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => { pick(e.target.files[0]); e.target.value = ""; }} />
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm">
              <FileText size={16} className="text-slate-500" />
              <span className="min-w-0 flex-1 truncate font-medium">{file.name}</span>
              <span className="text-xs text-slate-500">{formatSize(file.size / 1024)}</span>
              <button onClick={clear} aria-label="Remove file" className="rounded p-1 text-slate-400 hover:text-red-500"><X size={16} /></button>
            </div>
            <div className="relative flex h-60 items-center justify-center overflow-hidden rounded-xl border border-line bg-slate-100">
              {url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={url} alt="Scan preview" className="max-h-full max-w-full object-contain" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-500"><FileText size={36} strokeWidth={1.5} /><span className="text-xs">{kindOf(file.name).toUpperCase()} document</span></div>
              )}
              {running && <div className="scan-band pointer-events-none absolute inset-x-0 h-12 border-b-2 border-brand/70 bg-linear-to-b from-transparent to-brand/20" />}
            </div>
            {running ? (
              <div className="mt-3">
                <div className="mb-1.5 flex items-center justify-between text-xs text-slate-600"><span className="flex items-center gap-2"><Loader2 size={13} className="animate-spin" />{STAGES[stage]}</span><b>{pct}%</b></div>
                <Bar pct={pct} color="bg-brand" height="h-1.5" />
              </div>
            ) : (
              <button onClick={run} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-brand py-2.5 text-sm font-semibold text-white hover:bg-brand-dark">
                <ScanText size={16} /> {text ? "Scan again" : "Extract text"}
              </button>
            )}
          </div>

          <div className="flex min-w-0 flex-col">
            <div className="mb-2 flex items-center gap-2 text-sm">
              <span className="font-medium">Extracted text</span>
              {text && <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs text-emerald-600"><Check size={12} /> 96% confidence</span>}
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={running ? "Reading the document..." : "The recognised text appears here. You can edit it."}
              readOnly={running}
              className="min-h-60 flex-1 resize-y rounded-xl border border-slate-200 bg-white p-3 font-mono text-xs leading-relaxed outline-none focus:border-brand"
            />
            {text && (
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={copy} className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-xs font-medium hover:bg-slate-50"><Copy size={14} /> Copy</button>
                <button onClick={() => { downloadBlob(new Blob([text], { type: "text/plain" }), `${file.name.replace(/\.[^.]+$/, "")}-ocr.txt`); toast("Text file downloaded"); }} className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-xs font-medium hover:bg-slate-50"><Download size={14} /> Download .txt</button>
                <button onClick={save} className="flex items-center gap-2 rounded-lg bg-orange-50 px-3 py-2 text-xs font-medium text-brand hover:bg-orange-100"><FolderPlus size={14} /> Save to case notes</button>
              </div>
            )}
          </div>
        </div>
      )}
      <p className="mt-3 text-xs text-slate-400">Demo: the extracted text is sample output for the selected case, not a real reading of your file.</p>
    </section>
  );
}
