import { ChevronLeft, ChevronRight } from "lucide-react";

// 1 2 3 ... 13 style list once there are too many pages to show all of them
function pageList(current, pages) {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  if (current <= 3) return [1, 2, 3, "...", pages];
  if (current >= pages - 2) return [1, "...", pages - 2, pages - 1, pages];
  return [1, "...", current - 1, current, current + 1, "...", pages];
}

export default function Pagination({ total, page, pageSize, onPage, onPageSize, unit = "cases" }) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const current = Math.min(page, pages);
  const start = (current - 1) * pageSize;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line p-4 text-sm text-slate-600">
      <p>
        Showing <b className="text-ink">{total ? start + 1 : 0}</b> to{" "}
        <b className="text-ink">{Math.min(start + pageSize, total)}</b> of{" "}
        <b className="text-ink">{total}</b> {unit}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <button disabled={current === 1} onClick={() => onPage(current - 1)} aria-label="Previous page" className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 disabled:opacity-40">
          <ChevronLeft size={16} />
        </button>
        {pageList(current, pages).map((p, i) =>
          p === "..." ? (
            <span key={`gap${i}`} className="px-1 text-slate-400">...</span>
          ) : (
          <button
            key={p}
            onClick={() => onPage(p)}
            className={`h-9 w-9 rounded-lg border text-sm font-medium ${
              p === current ? "border-brand bg-brand text-white" : "border-slate-200 hover:bg-slate-50"
            }`}
          >
            {p}
          </button>
          )
        )}
        <button disabled={current === pages} onClick={() => onPage(current + 1)} aria-label="Next page" className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 disabled:opacity-40">
          <ChevronRight size={16} />
        </button>
        <select
          value={pageSize}
          onChange={(e) => onPageSize(Number(e.target.value))}
          className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none sm:ml-2"
        >
          {[10, 20, 50].map((n) => (
            <option key={n} value={n}>{n} / page</option>
          ))}
        </select>
      </div>
    </div>
  );
}
