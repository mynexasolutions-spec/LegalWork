"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { seed } from "./seed";
import { uid, isoOf } from "./format";
import { caseSlug } from "./cases";

const KEY = "lexpro-data-v2";
const FALLBACK_TODAY = "2026-10-05"; // first render only, so server and client markup match; replaced right after mount
const Ctx = createContext(null);

const patchList = (list, match, patch) =>
  list.map((x) => (match(x) ? { ...x, ...(typeof patch === "function" ? patch(x) : patch) } : x));

// next number for a case-number prefix, e.g. CR/2026/221
const PREFIX = { Criminal: "CR", Civil: "CS", Writ: "WP", "Motor Vehicle": "MV" };
export function nextCaseNo(cases, type) {
  const p = PREFIX[type] ?? "CS";
  const max = cases.filter((c) => c.caseNo.startsWith(`${p}/2026/`)).reduce((m, c) => Math.max(m, Number(c.caseNo.split("/")[2]) || 0), 0);
  return `${p}/2026/${String(max + 1).padStart(3, "0")}`;
}

export function StoreProvider({ children }) {
  const [data, setData] = useState(seed);
  const [ready, setReady] = useState(false);
  const [today, setToday] = useState(FALLBACK_TODAY);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setData({ ...seed, ...JSON.parse(raw) });
    } catch {
      // unreadable saved data: fall back to the seed
    }
    setToday(isoOf(new Date()));
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
    } catch {
      // storage full or blocked: changes just won't survive a reload
    }
  }, [data, ready]);

  const upd = useCallback((key, fn) => setData((d) => ({ ...d, [key]: fn(d[key]) })), []);

  const actions = useMemo(() => {
    const log = (text) => upd("activity", (l) => [{ id: uid("a"), text, at: new Date().toISOString() }, ...l].slice(0, 200));
    const touch = (caseNo) => upd("cases", (l) => patchList(l, (c) => c.caseNo === caseNo, { updated: isoOf(new Date()) }));

    return {
      log,

      // ---- cases ----
      addCase: (c) => {
        const item = { id: caseSlug(c.caseNo), parties: [], extraDates: [], result: null, closedDate: null, updated: isoOf(new Date()), ...c };
        upd("cases", (l) => [item, ...l]);
        log(`Created case ${c.title}`);
        return item;
      },
      updateCase: (caseNo, patch) => upd("cases", (l) => patchList(l, (c) => c.caseNo === caseNo, { ...patch, updated: isoOf(new Date()) })),
      closeCase: (caseNo, result, closedDate) =>
        setData((d) => ({
          ...d,
          cases: patchList(d.cases, (c) => c.caseNo === caseNo, { status: "Closed", result, closedDate, updated: closedDate }),
          hearings: patchList(d.hearings, (h) => h.caseNo === caseNo && h.status === "Scheduled", { status: "Cancelled" }),
        })),
      reopenCase: (caseNo) => upd("cases", (l) => patchList(l, (c) => c.caseNo === caseNo, { status: "Active", result: null, closedDate: null, updated: isoOf(new Date()) })),
      deleteCase: (caseNo) =>
        setData((d) => ({
          ...d,
          cases: d.cases.filter((c) => c.caseNo !== caseNo),
          hearings: d.hearings.filter((h) => h.caseNo !== caseNo),
          reminders: d.reminders.filter((r) => r.caseNo !== caseNo),
          documents: patchList(d.documents, (x) => x.caseNo === caseNo, { trashed: true }),
        })),
      addParty: (caseNo, party) => {
        upd("cases", (l) => patchList(l, (c) => c.caseNo === caseNo, (c) => ({ parties: [...c.parties, { id: uid("p"), ...party }] })));
        touch(caseNo);
      },
      removeParty: (caseNo, id) => upd("cases", (l) => patchList(l, (c) => c.caseNo === caseNo, (c) => ({ parties: c.parties.filter((p) => p.id !== id) }))),
      addKeyDate: (caseNo, item) => upd("cases", (l) => patchList(l, (c) => c.caseNo === caseNo, (c) => ({ extraDates: [...c.extraDates, { id: uid("d"), ...item }] }))),
      removeKeyDate: (caseNo, id) => upd("cases", (l) => patchList(l, (c) => c.caseNo === caseNo, (c) => ({ extraDates: c.extraDates.filter((x) => x.id !== id) }))),

      // ---- hearings ----
      addHearing: (h) => {
        upd("hearings", (l) => [...l, { id: uid("h"), status: "Scheduled", remarks: "", ...h }]);
        touch(h.caseNo);
      },
      updateHearing: (id, patch) => {
        setData((d) => {
          const h = d.hearings.find((x) => x.id === id);
          return {
            ...d,
            hearings: patchList(d.hearings, (x) => x.id === id, patch),
            cases: h ? patchList(d.cases, (c) => c.caseNo === h.caseNo, { updated: isoOf(new Date()) }) : d.cases,
          };
        });
      },
      deleteHearing: (id) => upd("hearings", (l) => l.filter((h) => h.id !== id)),

      // ---- reminders ----
      addReminder: (r) => upd("reminders", (l) => [...l, { id: uid("r"), completed: false, icon: "doc", ...r }]),
      updateReminder: (id, patch) => upd("reminders", (l) => patchList(l, (r) => r.id === id, patch)),
      completeReminders: (ids, completed = true) => upd("reminders", (l) => patchList(l, (r) => ids.includes(r.id), { completed })),
      deleteReminders: (ids) => upd("reminders", (l) => l.filter((r) => !ids.includes(r.id))),

      // ---- documents ----
      addDocuments: (docs) => upd("documents", (l) => [...docs, ...l]),
      updateDocument: (id, patch) => upd("documents", (l) => patchList(l, (x) => x.id === id, patch)),
      trashDocuments: (ids) => upd("documents", (l) => patchList(l, (x) => ids.includes(x.id), { trashed: true })),
      restoreDocuments: (ids) => upd("documents", (l) => patchList(l, (x) => ids.includes(x.id), { trashed: false })),
      purgeDocuments: (ids) => upd("documents", (l) => l.filter((x) => !ids.includes(x.id))),

      addFolder: (label) => upd("folders", (l) => [...l, { id: uid("fd"), label }]),
      removeFolder: (id) =>
        setData((d) => ({ ...d, folders: d.folders.filter((f) => f.id !== id), documents: patchList(d.documents, (x) => x.folderId === id, { folderId: null }) })),

      // ---- clients ----
      addClient: (c) => {
        const item = { id: uid("cl"), totalCases: 0, activeCases: 0, status: "Active", documents: 0, added: isoOf(new Date()), referredBy: "Self", ...c };
        upd("clients", (l) => [item, ...l]);
        log(`Added client ${c.name}`);
        return item;
      },
      updateClient: (id, patch) => upd("clients", (l) => patchList(l, (c) => c.id === id, patch)),
      deleteClient: (id) => upd("clients", (l) => l.filter((c) => c.id !== id)),

      // ---- team ----
      addMember: (m) => {
        const item = { id: uid("m"), status: "Active", stats: { total: 0, active: 0, hearings: 0, documents: 0 }, ...m };
        upd("members", (l) => [...l, item]);
        log(`Added team member ${m.name}`);
        return item;
      },
      updateMember: (id, patch) => upd("members", (l) => patchList(l, (m) => m.id === id, patch)),
      deleteMember: (id) => upd("members", (l) => l.filter((m) => m.id !== id)),
      addInvite: (inv) => {
        upd("invites", (l) => [...l, { id: uid("inv"), date: isoOf(new Date()), ...inv }]);
        log(`Invited ${inv.email} as ${inv.role}`);
      },
      revokeInvite: (id) => upd("invites", (l) => l.filter((i) => i.id !== id)),
      setRoles: (roles) => upd("roles", () => roles),

      // ---- notes ----
      addNote: (key, note) => upd("notes", (n) => ({ ...n, [key]: [...(n[key] ?? []), { id: uid("n"), ...note }] })),
      deleteNote: (key, id) => upd("notes", (n) => ({ ...n, [key]: (n[key] ?? []).filter((x) => x.id !== id) })),

      // ---- misc ----
      markRead: (ids) => upd("readNotifs", (l) => [...new Set([...l, ...ids])]),
      toggleSaved: (id) => upd("saved", (l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id])),
      setLogo: (logo) => upd("logo", () => logo),
      resetAll: () => setData(seed),
      replaceAll: (next) => setData({ ...seed, ...next }),
    };
  }, [upd]);

  const value = useMemo(() => {
    const caseTitle = (caseNo) => data.cases.find((c) => c.caseNo === caseNo)?.title ?? caseNo;
    // each case plus its next scheduled hearing on/after today
    const cases = data.cases.map((c) => {
      const next = data.hearings
        .filter((h) => h.caseNo === c.caseNo && h.status === "Scheduled" && h.date >= today)
        .sort((a, b) => a.date.localeCompare(b.date))[0];
      return { ...c, hearingDate: next?.date ?? null, hearingTime: next?.time ?? null, nextHearingId: next?.id ?? null };
    });
    return { ...data, cases, today, ready, caseTitle, exportData: () => data, ...actions };
  }, [data, today, ready, actions]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export const useStore = () => useContext(Ctx);

// whole days from today to an ISO date (negative = past)
export function daysFrom(todayIso, iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const [ty, tm, td] = todayIso.split("-").map(Number);
  return Math.round((Date.UTC(y, m - 1, d) - Date.UTC(ty, tm - 1, td)) / 86400000);
}
