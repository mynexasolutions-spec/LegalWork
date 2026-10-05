"use client";

import { useEffect, useState } from "react";
import { LayoutList, Table2 } from "lucide-react";

// Copies each column header onto its cells (data-label) so the mobile CSS can show
// "Label: value" rows. Runs again whenever the page re-renders its tables.
const KEY = "lexpro-mobile-table";

export default function ResponsiveTables() {
  const [asTable, setAsTable] = useState(false);
  const [hasTable, setHasTable] = useState(false);

  useEffect(() => {
    try { setAsTable(localStorage.getItem(KEY) === "1"); } catch { /* no saved choice */ }
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("mobile-table", asTable);
    try { localStorage.setItem(KEY, asTable ? "1" : "0"); } catch { /* storage blocked */ }
  }, [asTable]);

  useEffect(() => {
    const headText = (th) => {
      const node = [...th.childNodes].find((n) => n.textContent.trim());
      return node ? node.textContent.trim() : "";
    };
    const label = (table) => {
      const heads = [...table.querySelectorAll("thead th")].map(headText);
      table.querySelectorAll("tbody tr").forEach((tr) => {
        let primary = false;
        [...tr.children].forEach((td, i) => {
          if (td.hasAttribute("colspan")) return;
          const h = heads[i];
          if (!h) { if (td.querySelector("input[type=checkbox]")) td.dataset.select = "1"; return; } // row checkbox
          if (h === "#") { td.dataset.skip = "1"; return; } // row numbers add nothing on a card
          if (td.dataset.label !== h) td.dataset.label = h;
          // the first real column (name/title) leads the card
          if (!primary) { primary = true; td.dataset.primary = "1"; }
        });
      });
    };
    const run = () => {
      const tables = document.querySelectorAll("main table:not(.keep-table)");
      tables.forEach((t) => { t.classList.add("rt"); label(t); });
      setHasTable(tables.length > 0);
    };
    run();
    const mo = new MutationObserver(run);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, []);
  if (!hasTable) return null;
  // phones only: switch between stacked cards and the real (side-scrolling) table
  return (
    <button
      onClick={() => setAsTable((v) => !v)}
      aria-pressed={asTable}
      className="fixed bottom-4 right-4 z-30 flex items-center gap-2 rounded-full bg-sidebar px-4 py-2.5 text-xs font-semibold text-white shadow-lg md:hidden"
    >
      {asTable ? <><LayoutList size={15} /> Card view</> : <><Table2 size={15} /> Table view</>}
    </button>
  );
}
