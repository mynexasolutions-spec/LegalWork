"use client";

import { useEffect } from "react";

// Copies each column header onto its cells (data-label) so the mobile CSS can show
// "Label: value" rows. Runs again whenever the page re-renders its tables.
export default function ResponsiveTables() {
  useEffect(() => {
    const label = (table) => {
      const heads = [...table.querySelectorAll("thead th")].map((th) => th.innerText.split("\n")[0].trim());
      table.querySelectorAll("tbody tr").forEach((tr) => {
        let primary = false;
        [...tr.children].forEach((td, i) => {
          if (td.hasAttribute("colspan")) return;
          const h = heads[i];
          if (!h) return;
          if (td.dataset.label !== h) td.dataset.label = h;
          // the first labelled cell (name/title) leads the card
          if (!primary) { primary = true; td.dataset.primary = "1"; }
        });
      });
    };
    const run = () => document.querySelectorAll("main table:not(.keep-table)").forEach((t) => { t.classList.add("rt"); label(t); });
    run();
    const mo = new MutationObserver(run);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, []);
  return null;
}
