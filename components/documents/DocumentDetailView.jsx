"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, ChevronLeft, Download, Share2, Pencil, Trash2, Minus, Plus, FileText, HardDrive, Calendar, UserCircle, MapPin, Undo2, FolderOpen, Eye } from "lucide-react";
import FileIcon from "./FileIcon";
import Badge from "@/components/Badge";
import { useStore } from "@/lib/store";
import { useActions } from "@/components/ui/ActionsProvider";
import { useToast } from "@/components/ui/Toast";
import { fileBlobs } from "@/lib/files";
import { formatDate, caseSlug } from "@/lib/cases";
import { formatSize } from "@/lib/format";
import { kindLabel, typeStyles } from "@/lib/documents";

const PAGES = 5;
const outline = "flex items-center gap-2 rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-medium hover:bg-slate-50";

// stand-in for a real page render of the seeded demo documents
function DemoPage({ doc, caseTitle, page }) {
  const bars = (n, seed) => Array.from({ length: n }, (_, i) => <div key={i} className="h-1.5 rounded bg-slate-200" style={{ width: `${100 - ((i * 7 + seed * 11) % 26)}%` }} />);
  if (doc.name.startsWith("FIR") && page === 1) {
    const rows = [["1. District", "Lucknow"], ["2. Police Station", "Hazratganj"], ["3. FIR No.", "0123/2026"], ["4. Date", "10.01.2026"], ["5. Complainant", "Rajesh Kumar"], ["6. Sections", "Sections 379 IPC"]];
    return (
      <div className="space-y-3 text-sm text-slate-800">
        <p className="text-center text-lg font-bold">FIRST INFORMATION REPORT</p>
        <p className="text-center text-xs text-slate-500">Under Section 154 Cr.P.C.</p>
        <div className="space-y-1.5 pt-2">{rows.map(([k, v]) => <div key={k} className="flex"><span className="w-40 text-slate-600">{k}</span><span className="font-medium">: {v}</span></div>)}</div>
        <div className="space-y-2 pt-4">{bars(14, page)}</div>
      </div>
    );
  }
  return (
    <div className="space-y-3 text-sm text-slate-700">
      <p className="text-center text-lg font-bold">{doc.name}</p>
      <p className="text-center text-xs text-slate-500">{caseTitle} - page {page} of {PAGES}</p>
      <div className="space-y-2 pt-4">{bars(20, page)}</div>
    </div>
  );
}

export default function DocumentDetailView({ id }) {
  const s = useStore();
  const act = useActions();
  const toast = useToast();
  const router = useRouter();
  const doc = s.documents.find((d) => d.id === id);
  const [zoom, setZoom] = useState(100);
  const [page, setPage] = useState(1);
  const [url, setUrl] = useState(null);

  // an upload from this session is a real File, so it can be previewed for real
  useEffect(() => {
    const f = fileBlobs.get(id);
    if (!f) return setUrl(null);
    const u = URL.createObjectURL(f);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [id]);

  useEffect(() => { document.title = doc ? `${doc.name} - LexPro` : "Document not found - LexPro"; }, [doc]);

  if (!doc) {
    return (
      <div className="mx-auto max-w-3xl pt-10">
        <div className="flex flex-col items-center gap-3 rounded-xl border border-line bg-white py-16 text-slate-500 shadow-sm">
          <FileText size={32} strokeWidth={1.5} />
          <p className="text-sm">This document doesn&apos;t exist (it may have been deleted).</p>
          <Link href="/documents" className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white">Back to Documents</Link>
        </div>
      </div>
    );
  }

  const c = s.cases.find((x) => x.caseNo === doc.caseNo);
  const caseTitle = c?.title ?? "General";
  const real = fileBlobs.get(id);
  const siblings = s.documents.filter((d) => d.caseNo === doc.caseNo && d.id !== doc.id && !d.trashed).slice(0, 5);
  const activity = [{ text: `Uploaded by ${doc.by}`, when: `${formatDate(doc.date)}, ${doc.time}` }, ...(doc.trashed ? [{ text: "Moved to Trash", when: "Just now" }] : [])];

  const info = [
    [FileText, "Format", kindLabel[doc.kind]],
    [HardDrive, "Size", formatSize(doc.sizeKb)],
    [Calendar, "Added", `${formatDate(doc.date)}, ${doc.time}`],
    [UserCircle, "Uploaded by", doc.by],
    [MapPin, "Stored in", `/${doc.type}s/${caseTitle}`],
  ];

  return (
    <div className="mx-auto flex max-w-350 flex-col gap-5">
      <nav className="flex items-center gap-2 text-sm text-slate-600">
        <Link href="/documents" className="hover:text-brand">Documents</Link><ChevronRight size={14} /><span className="max-w-xs truncate text-ink">{doc.name}</span>
      </nav>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <FileIcon kind={doc.kind} size={26} box="h-14 w-14" />
          <div>
            <div className="flex flex-wrap items-center gap-3"><h1 className="text-3xl font-bold">{doc.name}</h1><Badge className={typeStyles[doc.type]}>{doc.type}</Badge>{doc.trashed && <Badge className="bg-red-50 text-red-600">In Trash</Badge>}</div>
            <p className="mt-1 text-sm text-slate-600">{c ? <Link href={`/cases/${c.id}`} className="hover:text-brand">{caseTitle}</Link> : "General"}{doc.caseNo && <span className="text-slate-400"> &bull; {doc.caseNo}</span>}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => act.shareDoc(doc)} className={outline}><Share2 size={16} /> Share</button>
          <button onClick={() => act.renameDoc(doc)} className={outline}><Pencil size={16} /> Rename</button>
          {doc.trashed ? (
            <button onClick={() => { s.restoreDocuments([doc.id]); toast("Document restored"); }} className={outline}><Undo2 size={16} /> Restore</button>
          ) : (
            <button onClick={() => act.trashDocs([doc.id], () => router.push("/documents"))} className={`${outline} text-red-600 hover:bg-red-50`}><Trash2 size={16} /> Move to Trash</button>
          )}
          <button onClick={() => act.downloadDoc(doc)} className="flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark"><Download size={16} /> Download</button>
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[1fr_340px]">
        <section className="overflow-hidden rounded-xl border border-line bg-white shadow-sm">
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-2.5 text-sm">
            {real && (doc.kind === "pdf" || doc.kind === "image") ? (
              <span className="text-slate-500">Live preview of your uploaded file</span>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} aria-label="Previous page" className="rounded-md p-1.5 hover:bg-slate-100 disabled:opacity-30"><ChevronLeft size={16} /></button>
                <span className="rounded bg-slate-100 px-2.5 py-1">{page} <span className="text-slate-400">/ {PAGES}</span></span>
                <button onClick={() => setPage((p) => Math.min(PAGES, p + 1))} disabled={page === PAGES} aria-label="Next page" className="rounded-md p-1.5 hover:bg-slate-100 disabled:opacity-30"><ChevronRight size={16} /></button>
              </div>
            )}
            {!(real && (doc.kind === "pdf" || doc.kind === "image")) && (
              <div className="flex items-center gap-2">
                <button onClick={() => setZoom((z) => Math.max(50, z - 25))} aria-label="Zoom out" className="rounded-md p-1.5 hover:bg-slate-100"><Minus size={15} /></button>
                <span className="w-12 text-center">{zoom}%</span>
                <button onClick={() => setZoom((z) => Math.min(200, z + 25))} aria-label="Zoom in" className="rounded-md p-1.5 hover:bg-slate-100"><Plus size={15} /></button>
              </div>
            )}
          </div>
          <div className="h-[34rem] overflow-auto bg-slate-100 p-5">
            {url && doc.kind === "pdf" ? (
              <iframe src={url} title={doc.name} className="h-full w-full rounded bg-white" />
            ) : url && doc.kind === "image" ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={url} alt={doc.name} className="mx-auto max-h-full rounded bg-white object-contain shadow" />
            ) : (
              <div key={page} className="anim-fade mx-auto origin-top bg-white p-10 shadow" style={{ width: `${Math.min(100, 70 * (zoom / 100))}%`, minWidth: 280, minHeight: "30rem" }}>
                <DemoPage doc={doc} caseTitle={caseTitle} page={page} />
              </div>
            )}
          </div>
        </section>

        <aside className="stagger flex flex-col gap-5">
          <section className="rounded-xl border border-line bg-white p-5 shadow-sm">
            <h2 className="mb-3 font-bold">Details</h2>
            <ul className="space-y-3 text-sm">
              {info.map(([Icon, k, v]) => (
                <li key={k} className="grid grid-cols-[20px_90px_1fr] items-start gap-2"><Icon size={16} className="mt-0.5 text-slate-500" /><span className="text-slate-500">{k}</span><span className="break-words font-medium">{v}</span></li>
              ))}
            </ul>
          </section>

          {c && (
            <section className="rounded-xl border border-line bg-white p-5 shadow-sm">
              <h2 className="mb-3 font-bold">Related case</h2>
              <Link href={`/cases/${c.id}`} className="flex items-center gap-3 rounded-lg border border-line p-3 hover:bg-slate-50"><FolderOpen size={20} className="text-brand" /><span className="text-sm leading-tight"><span className="block font-semibold">{c.title}</span><span className="text-xs text-slate-500">{c.caseNo} &bull; {c.status}</span></span></Link>
              {siblings.length > 0 && (
                <>
                  <p className="mb-2 mt-4 text-xs font-medium uppercase tracking-wide text-slate-400">Other documents in this case</p>
                  <ul className="space-y-1">
                    {siblings.map((d) => (<li key={d.id}><Link href={`/documents/${d.id}`} className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-slate-50"><Eye size={14} className="text-slate-400" /><span className="truncate">{d.name}</span></Link></li>))}
                  </ul>
                </>
              )}
            </section>
          )}

          <section className="rounded-xl border border-line bg-white p-5 shadow-sm">
            <h2 className="mb-3 font-bold">Activity</h2>
            <ul className="space-y-3 text-sm">
              {activity.map((a) => (<li key={a.text} className="flex gap-3"><span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" /><div><p className="font-medium">{a.text}</p><p className="text-xs text-slate-500">{a.when}</p></div></li>))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
