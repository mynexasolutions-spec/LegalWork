"use client";

import { useRef, useState } from "react";
import { FileText, ChevronDown } from "lucide-react";
import { useStore } from "@/lib/store";
import { formatSize, kindOf } from "@/lib/format";

const MAX_BYTES = 20 * 1024 * 1024;

export default function CaseSelector({ caseNo, onCase, files, setFiles }) {
  const s = useStore();
  const [over, setOver] = useState(false);
  const [error, setError] = useState("");
  const input = useRef(null);

  const addFiles = (list) => {
    const ok = [];
    const big = [];
    for (const f of list) {
      if (f.size > MAX_BYTES) big.push(f.name);
      else ok.push({ id: `u-${f.name}-${f.size}-${Math.random().toString(36).slice(2, 6)}`, name: f.name, size: formatSize(f.size / 1024), kind: kindOf(f.name), checked: true });
    }
    setError(big.length ? `Too large (max 20MB): ${big.join(", ")}` : "");
    if (ok.length) setFiles((prev) => [...prev, ...ok]);
  };

  const toggle = (id) => setFiles((fs) => fs.map((f) => (f.id === id ? { ...f, checked: !f.checked } : f)));
  const picked = files.filter((f) => f.checked).length;

  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
      <div>
        <h2 className="font-bold">1. Select Case File(s)</h2>
        <p className="mb-3 text-sm text-slate-500">Upload case documents or select from existing case files</p>
        <div
          onClick={() => input.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setOver(true); }}
          onDragLeave={() => setOver(false)}
          onDrop={(e) => { e.preventDefault(); setOver(false); addFiles([...e.dataTransfer.files]); }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Enter" && input.current?.click()}
          className={`flex h-34 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed text-center transition ${over ? "scale-[1.01] border-brand bg-orange-50" : "border-slate-300 bg-slate-50 hover:bg-slate-100"}`}
        >
          <FileText size={34} strokeWidth={1.5} className={over ? "text-brand" : "text-slate-600"} />
          <p className="text-sm font-semibold">Drag &amp; drop files here, or click to upload</p>
          <p className="text-xs text-slate-500">PDF, DOC, DOCX, TXT (Max 20MB each)</p>
          <input ref={input} type="file" multiple accept=".pdf,.doc,.docx,.txt" className="hidden" onChange={(e) => { addFiles([...e.target.files]); e.target.value = ""; }} />
        </div>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      </div>

      <div>
        <label htmlFor="case-select" className="mb-3 block text-sm font-medium text-slate-700">Or select from your cases</label>
        <div className="relative mb-3">
          <select id="case-select" value={caseNo} onChange={(e) => onCase(e.target.value)} className="h-11 w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 pr-9 text-sm outline-none focus:border-brand">
            {s.cases.map((c) => <option key={c.caseNo} value={c.caseNo}>{c.title} ({c.caseNo})</option>)}
          </select>
          <ChevronDown size={16} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
        </div>
        <ul className="max-h-40 divide-y divide-line overflow-y-auto rounded-lg border border-line">
          {files.length === 0 && <li className="p-4 text-center text-sm text-slate-500">No documents on this case. Upload one on the left.</li>}
          {files.map((f) => (
            <li key={f.id}>
              <label className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm hover:bg-slate-50">
                <input type="checkbox" checked={f.checked} onChange={() => toggle(f.id)} className="h-4 w-4 accent-brand" />
                <FileText size={18} className={f.kind === "pdf" ? "text-red-500" : "text-amber-500"} />
                <span className="flex-1 truncate">{f.name}</span>
                <span className="text-xs text-slate-500">{f.size}</span>
              </label>
            </li>
          ))}
        </ul>
        <p className="mt-1.5 text-xs text-slate-500">{picked} of {files.length} selected for analysis</p>
      </div>
    </div>
  );
}
