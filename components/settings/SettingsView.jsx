"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Settings, Building2, Users, FolderOpen, Bell, Blocks, ShieldCheck, Palette, CreditCard, ChevronDown, ChevronRight,
  Mail, MonitorSmartphone, CalendarClock, ListChecks, UserRound, Megaphone, KeyRound, Clock, ShieldAlert, Trash2, Crown,
  Sun, Moon, Monitor, Hash, UserCheck, DatabaseBackup, Upload, ScrollText, RotateCcw, Check, FolderPlus, Briefcase,
} from "lucide-react";
import { GiScales } from "react-icons/gi";
import { colors, defaults, loadSettings, saveSettings, applyBrandColor, resetBrandColor } from "@/lib/settings";
import Modal from "@/components/ui/Modal";
import Bar from "@/components/ui/Bar";
import { useStore } from "@/lib/store";
import { useToast } from "@/components/ui/Toast";
import { downloadBlob, isoOf } from "@/lib/format";
import { formatDate } from "@/lib/cases";

const TABS = [
  ["general", "General", Settings], ["organization", "Organization", Building2], ["roles", "Users & Roles", Users],
  ["case", "Case Management", FolderOpen], ["notifications", "Notifications", Bell], ["integrations", "Integrations", Blocks],
  ["security", "Security", ShieldCheck], ["appearance", "Appearance", Palette], ["billing", "Billing", CreditCard],
];

const input = "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-brand";

const Card = ({ id, icon: Icon, tint, title, note, children }) => (
  <section id={id} className="scroll-mt-24 rounded-xl border border-line bg-white p-4 shadow-sm sm:p-5">
    <div className="mb-4 flex items-center gap-3">
      <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${tint}`}><Icon size={20} /></span>
      <div><h2 className="font-bold">{title}</h2><p className="text-xs text-slate-500">{note}</p></div>
    </div>
    {children}
  </section>
);

const Field = ({ label, children, className = "" }) => (
  <label className={`block ${className}`}><span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>{children}</label>
);

function Select({ value, onChange, options }) {
  return (
    <span className="relative block">
      <select value={value} onChange={(e) => onChange(e.target.value)} className={`${input} appearance-none pr-8`}>
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
      <ChevronDown size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
    </span>
  );
}

function Toggle({ on, onChange, label }) {
  return (
    <button role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? "bg-blue-600" : "bg-slate-300"}`}>
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${on ? "left-5.5" : "left-0.5"}`} />
    </button>
  );
}

const ToggleRow = ({ icon: Icon, title, note, on, onChange }) => (
  <div className="flex items-center gap-3 py-2.5">
    <Icon size={19} className="shrink-0 text-slate-700" />
    <div className="flex-1 leading-snug"><p className="text-sm font-medium">{title}</p><p className="text-xs text-slate-500">{note}</p></div>
    <Toggle on={on} onChange={onChange} label={title} />
  </div>
);

function SaveBar({ onSave, saved }) {
  return (
    <div className="mt-4 flex items-center justify-end gap-3">
      {saved && <span className="flex items-center gap-1 text-xs text-emerald-600"><Check size={14} /> Saved</span>}
      <button onClick={onSave} className="rounded-lg bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-dark">Save Changes</button>
    </div>
  );
}

function UsageBar({ icon: Icon, tint, bar, label, value, pct }) {
  return (
    <div className="flex items-center gap-3">
      <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${tint}`}><Icon size={17} /></span>
      <div className="flex-1">
        <p className="flex justify-between text-sm"><span>{label}</span><span className="text-slate-600">{value}</span></p>
        <div className="mt-1.5 flex"><Bar pct={pct} color={bar} /></div>
      </div>
    </div>
  );
}

const PLANS = [
  { name: "Starter", price: "Free", note: "1 user, 50 cases, 1 GB storage" },
  { name: "Professional", price: "Rs 2,999 / month", note: "50 users, 500 cases, 10 GB storage" },
  { name: "Enterprise", price: "Custom", note: "Unlimited users and cases, SSO, priority support" },
];

export default function SettingsView() {
  const store = useStore();
  const toast = useToast();
  const router = useRouter();
  const logoInput = useRef(null);
  const importInput = useRef(null);
  const [modal, setModal] = useState(null); // "plans" | "audit" | null
  const [plan, setPlan] = useState("Professional");
  const [auditQuery, setAuditQuery] = useState("");
  const [s, setS] = useState(defaults);
  const [tab, setTab] = useState("general");
  const [saved, setSaved] = useState(null); // which card last showed "Saved"
  const timer = useRef(null);

  useEffect(() => {
    setS(loadSettings());
    return () => clearTimeout(timer.current);
  }, []);

  const flash = (key) => {
    setSaved(key);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setSaved(null), 2000);
  };
  const set = (section, patch) => setS((cur) => ({ ...cur, [section]: { ...cur[section], ...patch } }));
  // switches take effect straight away, so they write to storage on change
  const setNow = (section, patch) => {
    const next = { ...s, [section]: { ...s[section], ...patch } };
    setS(next);
    saveSettings(next);
  };
  const save = (key) => { saveSettings(s); flash(key); };

  const pickLogo = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast("Please choose an image file (PNG or JPG)", "error");
    if (file.size > 400 * 1024) return toast("Logo is too large - keep it under 400 KB", "error");
    const reader = new FileReader();
    reader.onload = () => { store.setLogo(reader.result); toast("Logo updated"); };
    reader.readAsDataURL(file);
  };

  const backup = () => {
    downloadBlob(new Blob([JSON.stringify(store.exportData(), null, 2)], { type: "application/json" }), `lexpro-backup-${isoOf(new Date())}.json`);
    toast("Backup downloaded");
  };

  const restore = async (file) => {
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      if (!Array.isArray(data.cases) || !Array.isArray(data.clients)) throw new Error("not a LexPro backup");
      store.replaceAll(data);
      toast("Backup restored");
    } catch {
      toast("That file isn't a valid LexPro backup (.json)", "error");
    }
  };

  const go = (id) => {
    if (id === "roles") return router.push("/team");
    setTab(id);
    const target = { roles: "organization", integrations: "quick", billing: "plan" }[id] ?? id;
    document.getElementById(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const pickColor = (color) => {
    const next = { ...s, appearance: { ...s.appearance, color } };
    setS(next);
    saveSettings(next);
    applyBrandColor(color);
  };

  const resetAll = () => {
    if (!window.confirm("Reset all settings AND all demo data (cases, clients, documents...) back to the original sample data?")) return;
    saveSettings(defaults);
    setS(defaults);
    resetBrandColor();
    store.resetAll();
    toast("App data reset");
  };

  const audit = useMemo(() => {
    const q = auditQuery.trim().toLowerCase();
    return store.activity.filter((a) => !q || a.text.toLowerCase().includes(q));
  }, [store.activity, auditQuery]);

  const g = s.general, o = s.org, n = s.notifications, c = s.caseMgmt, sec = s.security, a = s.appearance;

  const quick = [
    [DatabaseBackup, "Backup & Restore", "Download a full backup (JSON)", "bg-blue-50 text-blue-600", backup],
    [Upload, "Data Import", "Restore from a LexPro backup file", "bg-emerald-50 text-emerald-600", () => importInput.current.click()],
    [ScrollText, "Audit Logs", "View recent activity", "bg-red-50 text-red-500", () => setModal("audit")],
    [RotateCcw, "Reset App Data", "Restore the original sample data", "bg-orange-50 text-orange-500", resetAll],
  ];

  return (
    <div className="mx-auto flex max-w-350 flex-col gap-5">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl sm:h-13 sm:w-13 bg-purple-600 text-white"><Settings size={26} /></div>
        <div className="min-w-0">
          <h1 className="text-3xl font-bold leading-tight">Settings</h1>
          <p className="text-slate-600">Manage your preferences, organization settings and system configuration.</p>
        </div>
      </div>

      <div className="flex overflow-x-auto rounded-xl border border-line bg-white p-1.5 shadow-sm">
        {TABS.map(([id, label, Icon]) => (
          <button key={id} onClick={() => go(id)} className={`flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2.5 text-sm font-medium sm:gap-2.5 sm:px-5 ${tab === id ? "bg-peach" : "text-slate-600 hover:bg-slate-50"}`}>
            <Icon size={17} /> {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-2 xl:grid-cols-[1fr_1fr_340px]">
        <div className="flex flex-col gap-5">
          <Card id="general" icon={Settings} tint="bg-purple-50 text-purple-600" title="General Settings" note="Basic application preferences and defaults.">
            <div className="space-y-4">
              <Field label="Application Name"><input className={input} value={g.appName} onChange={(e) => set("general", { appName: e.target.value })} /></Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Default Time Zone"><Select value={g.timezone} onChange={(v) => set("general", { timezone: v })} options={["(GMT+05:30) Asia/Kolkata", "(GMT+00:00) UTC", "(GMT+04:00) Asia/Dubai"]} /></Field>
                <Field label="Date Format"><Select value={g.dateFormat} onChange={(v) => set("general", { dateFormat: v })} options={["DD MMM YYYY (05 Oct 2026)", "MM/DD/YYYY (10/05/2026)", "YYYY-MM-DD (2026-10-05)"]} /></Field>
                <Field label="Time Format"><Select value={g.timeFormat} onChange={(v) => set("general", { timeFormat: v })} options={["12 Hour (10:30 AM)", "24 Hour (10:30)"]} /></Field>
                <Field label="Default Language"><Select value={g.language} onChange={(v) => set("general", { language: v })} options={["English", "Hindi"]} /></Field>
              </div>
            </div>
            <SaveBar onSave={() => save("general")} saved={saved === "general"} />
          </Card>

          <Card id="notifications" icon={Bell} tint="bg-purple-50 text-purple-600" title="Notification Settings" note="Configure how you want to receive notifications.">
            <div className="divide-y divide-line">
              <ToggleRow icon={Mail} title="Email Notifications" note="Receive important updates via email" on={n.email} onChange={(v) => setNow("notifications", { email: v })} />
              <ToggleRow icon={MonitorSmartphone} title="In-App Notifications" note="Show notifications in the application" on={n.inApp} onChange={(v) => setNow("notifications", { inApp: v })} />
              <ToggleRow icon={CalendarClock} title="Upcoming Hearing Reminders" note="Get reminded about upcoming hearings" on={n.hearings} onChange={(v) => setNow("notifications", { hearings: v })} />
              <ToggleRow icon={ListChecks} title="Task & Deadline Reminders" note="Reminders for tasks and important dates" on={n.tasks} onChange={(v) => setNow("notifications", { tasks: v })} />
              <ToggleRow icon={UserRound} title="Client Updates" note="Notifications for client-related activities" on={n.clients} onChange={(v) => setNow("notifications", { clients: v })} />
              <ToggleRow icon={Megaphone} title="System Announcements" note="Product updates and maintenance alerts" on={n.system} onChange={(v) => setNow("notifications", { system: v })} />
            </div>
          </Card>

          <Card id="security" icon={ShieldAlert} tint="bg-red-50 text-red-500" title="Security Settings" note="Manage security and access options.">
            <div className="divide-y divide-line">
              <ToggleRow icon={KeyRound} title="Two-Factor Authentication (2FA)" note="Add an extra layer of security to your account" on={sec.twoFA} onChange={(v) => setNow("security", { twoFA: v })} />
              <div className="flex items-center gap-3 py-2.5">
                <Clock size={19} className="shrink-0 text-slate-700" />
                <div className="flex-1 leading-snug"><p className="text-sm font-medium">Session Timeout</p><p className="text-xs text-slate-500">Auto logout after inactivity</p></div>
                <div className="w-32 sm:w-36"><Select value={sec.timeout} onChange={(v) => setNow("security", { timeout: v })} options={["15 Minutes", "30 Minutes", "1 Hour", "4 Hours"]} /></div>
              </div>
              <ToggleRow icon={ShieldCheck} title="Login Notifications" note="Get notified on new login attempts" on={sec.loginAlerts} onChange={(v) => setNow("security", { loginAlerts: v })} />
            </div>
          </Card>
        </div>

        <div className="flex flex-col gap-5">
          <Card id="organization" icon={Building2} tint="bg-purple-50 text-purple-600" title="Organization Details" note="Manage your firm/organization information.">
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto]">
                <Field label="Organization Name"><input className={input} value={o.name} onChange={(e) => set("org", { name: e.target.value })} /></Field>
                <div>
                  <span className="mb-1 block text-xs font-medium text-slate-600">Logo</span>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg bg-sidebar text-amber-300">
                      {store.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={store.logo} alt="Organization logo" className="h-full w-full object-contain" />
                      ) : <GiScales size={38} />}
                    </span>
                    <input ref={logoInput} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" className="hidden" onChange={(e) => { pickLogo(e.target.files[0]); e.target.value = ""; }} />
                    <button type="button" onClick={() => logoInput.current.click()} className="rounded-lg border border-line px-4 py-2 text-xs font-medium hover:bg-slate-50">Change Logo</button>
                    <button type="button" onClick={() => { store.setLogo(null); toast("Logo removed"); }} disabled={!store.logo} aria-label="Remove logo" className="rounded-lg bg-red-50 p-2 text-red-500 disabled:opacity-40"><Trash2 size={15} /></button>
                  </div>
                </div>
              </div>
              <Field label="Address"><textarea rows={3} className={`${input} h-auto resize-y py-2`} value={o.address} onChange={(e) => set("org", { address: e.target.value })} /></Field>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Phone Number"><input className={input} value={o.phone} onChange={(e) => set("org", { phone: e.target.value })} /></Field>
                <Field label="Email Address"><input type="email" className={input} value={o.email} onChange={(e) => set("org", { email: e.target.value })} /></Field>
              </div>
              <Field label="Website (Optional)"><input className={input} value={o.website} onChange={(e) => set("org", { website: e.target.value })} /></Field>
            </div>
            <SaveBar onSave={() => save("org")} saved={saved === "org"} />
          </Card>

          <Card id="case" icon={FolderOpen} tint="bg-purple-50 text-purple-600" title="Case Management Settings" note="Configure default settings for case management.">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Default Case Number Format"><Select value={c.numberFormat} onChange={(v) => set("caseMgmt", { numberFormat: v })} options={["YYYY/#### (2026/0001)", "CR/YYYY/### (CR/2026/001)"]} /></Field>
              <Field label="Default Case Status"><Select value={c.status} onChange={(v) => set("caseMgmt", { status: v })} options={["Active", "Pending", "Draft"]} /></Field>
              <Field label="Default Court"><Select value={c.court} onChange={(v) => set("caseMgmt", { court: v })} options={["District Court", "High Court", "Sessions Court", "Supreme Court"]} /></Field>
              <Field label="Default Case Type"><Select value={c.caseType} onChange={(v) => set("caseMgmt", { caseType: v })} options={["Criminal", "Civil", "Writ", "Motor Vehicle"]} /></Field>
            </div>
            <div className="mt-3 divide-y divide-line">
              <ToggleRow icon={Hash} title="Auto-generate case number" note="Automatically generate unique case numbers" on={c.autoNumber} onChange={(v) => set("caseMgmt", { autoNumber: v })} />
              <ToggleRow icon={UserCheck} title="Require client for new case" note="Make client selection mandatory when creating a case" on={c.requireClient} onChange={(v) => set("caseMgmt", { requireClient: v })} />
            </div>
            <SaveBar onSave={() => save("case")} saved={saved === "case"} />
          </Card>

          <Card id="appearance" icon={Palette} tint="bg-purple-50 text-purple-600" title="Appearance Settings" note="Customize the look and feel of the application.">
            <div className="flex flex-wrap items-center gap-3">
              <span className="w-full text-sm text-slate-600 sm:w-24">Theme</span>
              {[["Light", Sun], ["Dark", Moon], ["System", Monitor]].map(([t, Icon]) => (
                <button key={t} onClick={() => setNow("appearance", { theme: t })} className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium sm:flex-none sm:px-5 ${a.theme === t ? "border-brand bg-orange-50" : "border-line hover:bg-slate-50"}`}>
                  <Icon size={16} /> {t}
                </button>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="w-full text-sm text-slate-600 sm:w-24">Primary Color</span>
              {colors.map((col) => (
                <button key={col.id} onClick={() => pickColor(col.id)} aria-label={col.name} title={col.name} className={`flex h-9 w-9 items-center justify-center rounded-full ring-offset-2 ${a.color === col.id ? "ring-2 ring-slate-400" : ""}`} style={{ background: col.id }}>
                  {a.color === col.id && <Check size={16} className="text-white" />}
                </button>
              ))}
            </div>
            {a.theme !== "Light" && <p className="mt-3 text-xs text-slate-500">Dark mode isn&apos;t available yet; the app stays on the light theme.</p>}
          </Card>
        </div>

        <div className="flex flex-col gap-5 lg:col-span-2 xl:col-span-1">
          <section id="plan" className="scroll-mt-24 rounded-xl border border-line bg-white p-5 shadow-sm">
            <h2 className="mb-3 flex items-center gap-3 font-bold"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-500"><Crown size={18} /></span> Current Plan</h2>
            <div className="flex items-start justify-between">
              <div><p className="font-bold">{plan} Plan</p><p className="text-xs text-slate-500">Valid till 31 Dec 2026</p></div>
              <span className="rounded-md bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-600">Active</span>
            </div>
            <div className="mt-5 space-y-4">
              <UsageBar icon={Briefcase} tint="bg-blue-50 text-blue-600" bar="bg-sky-400" label="Cases" value={`${store.cases.length} / 500`} pct={(store.cases.length / 500) * 100} />
              <UsageBar icon={Users} tint="bg-emerald-50 text-emerald-600" bar="bg-emerald-500" label="Users" value={`${store.members.length} / 50`} pct={(store.members.length / 50) * 100} />
              <UsageBar icon={FolderPlus} tint="bg-purple-50 text-purple-600" bar="bg-purple-600" label="Storage" value="2.4 GB / 10 GB" pct={24} />
            </div>
            <button onClick={() => setModal("plans")} className="mt-5 w-full rounded-lg border border-line py-2.5 text-sm font-medium hover:bg-slate-50">Manage Subscription</button>
          </section>

          <section id="quick" className="scroll-mt-24 rounded-xl border border-line bg-white p-5 shadow-sm">
            <h2 className="mb-3 flex items-center gap-3 font-bold"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-500"><Blocks size={18} /></span> Quick Settings</h2>
            <ul className="space-y-2.5">
              {quick.map(([Icon, title, note, tint, action]) => (
                <li key={title}>
                  <button onClick={action ?? undefined} className="flex w-full items-center gap-3 rounded-lg border border-line p-3 text-left hover:bg-slate-50">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tint}`}><Icon size={17} /></span>
                    <span className="flex-1 text-sm leading-snug"><span className="block font-semibold">{title}</span><span className="block text-xs text-slate-500">{note}</span></span>
                    <ChevronRight size={16} className="text-slate-500" />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>

      <input ref={importInput} type="file" accept="application/json,.json" className="hidden" onChange={(e) => { restore(e.target.files[0]); e.target.value = ""; }} />

      {modal === "plans" && (
        <Modal title="Manage Subscription" subtitle="Plan changes are simulated in this demo." size="md" onClose={() => setModal(null)}>
          <ul className="space-y-3">
            {PLANS.map((p) => (
              <li key={p.name}>
                <button onClick={() => { setPlan(p.name); setModal(null); toast(p.name === plan ? "That's already your plan" : `Switched to the ${p.name} plan (demo)`, p.name === plan ? "info" : "success"); }} className={`lift flex w-full items-center gap-4 rounded-xl border p-4 text-left ${plan === p.name ? "border-brand bg-orange-50" : "border-line"}`}>
                  <span className="flex-1"><span className="block font-bold">{p.name}</span><span className="block text-sm text-slate-500">{p.note}</span></span>
                  <span className="text-sm font-semibold">{p.price}</span>
                  {plan === p.name && <Check size={18} className="text-brand" />}
                </button>
              </li>
            ))}
          </ul>
        </Modal>
      )}

      {modal === "audit" && (
        <Modal title="Audit Logs" subtitle="Recent activity across the workspace" size="lg" onClose={() => setModal(null)}>
          <input value={auditQuery} onChange={(e) => setAuditQuery(e.target.value)} placeholder="Filter activity..." className="mb-4 h-10 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none focus:border-brand" />
          <ul className="divide-y divide-line">
            {audit.length === 0 && <li className="py-8 text-center text-sm text-slate-500">No activity matches.</li>}
            {audit.map((a) => (
              <li key={a.id} className="flex items-start gap-3 py-3 text-sm">
                <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-emerald-500" />
                <span className="flex-1">{a.text}</span>
                <span className="shrink-0 text-xs text-slate-500">{formatDate(a.at.slice(0, 10))}, {new Date(a.at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}</span>
              </li>
            ))}
          </ul>
        </Modal>
      )}
    </div>
  );
}
