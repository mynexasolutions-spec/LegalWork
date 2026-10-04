"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Bell, ChevronDown, Menu, FolderOpen, User, Users, FileText, CalendarClock, ListChecks, Settings, LogOut, CheckCheck } from "lucide-react";
import { useStore, daysFrom } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useUI } from "@/components/ui/UIContext";
import { useToast } from "@/components/ui/Toast";
import { caseSlug, formatDate } from "@/lib/cases";

function useOutside(ref, onOutside, active) {
  useEffect(() => {
    if (!active) return;
    const h = (e) => ref.current && !ref.current.contains(e.target) && onOutside();
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [ref, onOutside, active]);
}

function SearchBox() {
  const s = useStore();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const box = useRef(null);
  const input = useRef(null);
  useOutside(box, () => setOpen(false), open);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        input.current?.focus();
        setOpen(true);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return [];
    const has = (...v) => v.some((x) => String(x ?? "").toLowerCase().includes(t));
    return [
      ...s.cases.filter((c) => has(c.title, c.caseNo, c.client)).slice(0, 4).map((c) => ({ key: c.id, icon: FolderOpen, label: c.title, sub: `${c.caseNo} - ${c.status}`, href: `/cases/${c.id}`, group: "Cases" })),
      ...s.clients.filter((c) => has(c.name, c.email, c.phone)).slice(0, 3).map((c) => ({ key: c.id, icon: User, label: c.name, sub: `${c.type} client - ${c.city || "-"}`, href: `/clients/${c.id}`, group: "Clients" })),
      ...s.members.filter((m) => has(m.name, m.email, m.role)).slice(0, 3).map((m) => ({ key: m.id, icon: Users, label: m.name, sub: `${m.title} - ${m.department}`, href: `/team/${m.id}`, group: "Team" })),
      ...s.documents.filter((d) => !d.trashed && has(d.name, d.caseNo)).slice(0, 3).map((d) => ({ key: d.id, icon: FileText, label: d.name, sub: d.type, href: `/documents/${d.id}`, group: "Documents" })),
    ];
  }, [q, s.cases, s.clients, s.members, s.documents]);

  const go = (r) => {
    router.push(r.href);
    setOpen(false);
    setQ("");
    input.current?.blur();
  };

  return (
    <div ref={box} className="relative w-full max-w-125">
      <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
      <input
        ref={input}
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Escape") { setOpen(false); input.current.blur(); }
          if (e.key === "Enter" && results[0]) go(results[0]);
        }}
        type="text"
        placeholder="Search cases, clients, team members, documents..."
        className="h-11 w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-20 text-sm outline-none transition focus:border-brand focus:bg-white"
      />
      <kbd className="absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-500 sm:block">Ctrl + K</kbd>

      {open && q.trim() && (
        <div className="anim-drop absolute left-0 right-0 top-full z-30 mt-2 max-h-96 overflow-y-auto rounded-xl border border-line bg-white p-1.5 shadow-xl">
          {results.length === 0 && <p className="px-4 py-6 text-center text-sm text-slate-500">No results for &quot;{q}&quot;</p>}
          {results.map((r, i) => {
            const Icon = r.icon;
            return (
              <div key={r.group + r.key}>
                {(i === 0 || results[i - 1].group !== r.group) && <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{r.group}</p>}
                <button onClick={() => go(r)} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-slate-50">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-600"><Icon size={16} /></span>
                  <span className="min-w-0 text-sm leading-tight"><span className="block truncate font-medium">{r.label}</span><span className="block truncate text-xs text-slate-500">{r.sub}</span></span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Notifications() {
  const s = useStore();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const box = useRef(null);
  useOutside(box, () => setOpen(false), open);

  const items = useMemo(() => {
    const when = (d) => { const n = daysFrom(s.today, d); return n < 0 ? "Overdue" : n === 0 ? "Today" : n === 1 ? "Tomorrow" : formatDate(d); };
    const rem = s.reminders.filter((r) => !r.completed && daysFrom(s.today, r.date) <= 1).map((r) => ({
      id: `r:${r.id}`, icon: ListChecks, title: r.title, sub: `${when(r.date)}, ${r.time}${r.caseNo ? ` - ${s.caseTitle(r.caseNo)}` : ""}`, href: "/reminders", date: r.date, urgent: daysFrom(s.today, r.date) <= 0,
    }));
    const hr = s.hearings.filter((h) => h.status === "Scheduled" && daysFrom(s.today, h.date) <= 2 && daysFrom(s.today, h.date) >= -3).map((h) => ({
      id: `h:${h.id}`, icon: CalendarClock, title: `Hearing: ${s.caseTitle(h.caseNo)}`, sub: `${when(h.date)}, ${h.time} - ${h.purpose}`, href: `/cases/${caseSlug(h.caseNo)}`, date: h.date, urgent: daysFrom(s.today, h.date) <= 0,
    }));
    return [...rem, ...hr].sort((a, b) => a.date.localeCompare(b.date));
  }, [s.reminders, s.hearings, s.today, s.cases]);

  const unread = items.filter((i) => !s.readNotifs.includes(i.id));

  return (
    <div ref={box} className="relative">
      <button onClick={() => setOpen(!open)} className="relative rounded-lg p-1.5 text-slate-700 hover:bg-slate-100" aria-label="Notifications">
        <Bell size={22} strokeWidth={1.75} className={unread.length ? "anim-ring" : ""} />
        {unread.length > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">{unread.length}</span>
        )}
      </button>
      {open && (
        <div className="anim-drop absolute right-0 top-full z-30 mt-2 w-85 max-w-[calc(100vw-2rem)] rounded-xl border border-line bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="font-bold">Notifications</p>
            {unread.length > 0 && (
              <button onClick={() => s.markRead(items.map((i) => i.id))} className="flex items-center gap-1.5 text-xs font-medium text-indigo-600"><CheckCheck size={14} /> Mark all read</button>
            )}
          </div>
          <ul className="max-h-96 overflow-y-auto">
            {items.length === 0 && <li className="px-4 py-8 text-center text-sm text-slate-500">You&apos;re all caught up.</li>}
            {items.map((n) => {
              const Icon = n.icon;
              const isNew = !s.readNotifs.includes(n.id);
              return (
                <li key={n.id}>
                  <button onClick={() => { s.markRead([n.id]); setOpen(false); router.push(n.href); }} className={`flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-slate-50 ${isNew ? "bg-orange-50/50" : ""}`}>
                    <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${n.urgent ? "bg-red-50 text-red-500" : "bg-sky-50 text-sky-600"}`}><Icon size={16} /></span>
                    <span className="min-w-0 flex-1 text-sm leading-snug"><span className="block font-semibold">{n.title}</span><span className="block text-xs text-slate-500">{n.sub}</span></span>
                    {isNew && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-brand" />}
                  </button>
                </li>
              );
            })}
          </ul>
          <Link href="/reminders" onClick={() => setOpen(false)} className="block border-t border-line px-4 py-2.5 text-center text-sm font-medium text-brand hover:bg-slate-50">View all reminders</Link>
        </div>
      )}
    </div>
  );
}

function UserMenu() {
  const toast = useToast();
  const router = useRouter();
  const { logout } = useAuth();
  const [open, setOpen] = useState(false);
  const box = useRef(null);
  useOutside(box, () => setOpen(false), open);

  const item = "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50";
  return (
    <div ref={box} className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-3 rounded-lg p-1 hover:bg-slate-50">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#9a4a3a] text-sm font-semibold text-white">H</span>
        <span className="hidden text-left leading-tight sm:block">
          <span className="block text-sm font-semibold">Harsh Kumar</span>
          <span className="block text-xs text-slate-500">Admin</span>
        </span>
        <ChevronDown size={16} className={`text-slate-600 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="anim-drop absolute right-0 top-full z-30 mt-2 w-56 rounded-xl border border-line bg-white p-1.5 shadow-xl">
          <Link href="/team/m0" onClick={() => setOpen(false)} className={item}><User size={16} /> My Profile</Link>
          <Link href="/settings" onClick={() => setOpen(false)} className={item}><Settings size={16} /> Settings</Link>
          <Link href="/team" onClick={() => setOpen(false)} className={item}><Users size={16} /> Team &amp; Roles</Link>
          <hr className="my-1 border-line" />
          <button onClick={() => { setOpen(false); logout(); toast("You have been logged out", "info"); router.replace("/login"); }} className={`${item} text-red-600 hover:bg-red-50`}><LogOut size={16} /> Log out</button>
        </div>
      )}
    </div>
  );
}

export default function Topbar() {
  const { setNavOpen } = useUI();
  return (
    <header className="sticky top-0 z-20 flex h-17 items-center justify-between gap-3 border-b border-line bg-white/80 px-4 backdrop-blur sm:px-6 lg:px-8">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <button onClick={() => setNavOpen(true)} aria-label="Open menu" className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 lg:hidden"><Menu size={22} /></button>
        <SearchBox />
      </div>
      <div className="flex items-center gap-4">
        <Notifications />
        <div className="hidden h-8 w-px bg-line sm:block" />
        <UserMenu />
      </div>
    </header>
  );
}
