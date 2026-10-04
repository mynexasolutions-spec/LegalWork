"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, Zap, Copy, Check, Scale, CalendarClock, Sparkles, ShieldCheck, FolderOpen } from "lucide-react";
import { GiScales } from "react-icons/gi";
import { useAuth, DEMO } from "@/lib/auth";
import { useToast } from "@/components/ui/Toast";

const features = [
  { icon: FolderOpen, title: "Every case in one place", text: "Track hearings, parties, documents and notes." },
  { icon: CalendarClock, title: "Never miss a date", text: "Smart reminders for hearings and deadlines." },
  { icon: Sparkles, title: "AI legal analysis", text: "Similar judgments and case summaries in seconds." },
];

function CopyChip({ label, value }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setDone(true);
      setTimeout(() => setDone(false), 1400);
    } catch {
      // clipboard blocked: the value is visible on screen anyway
    }
  };
  return (
    <button type="button" onClick={copy} className="group flex w-full items-center justify-between gap-3 rounded-lg bg-white/70 px-3 py-2 text-left hover:bg-white">
      <span className="min-w-0">
        <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</span>
        <span className="block truncate font-mono text-sm text-ink">{value}</span>
      </span>
      {done ? <Check size={15} className="shrink-0 text-emerald-500" /> : <Copy size={15} className="shrink-0 text-slate-400 group-hover:text-brand" />}
    </button>
  );
}

export default function LoginView() {
  const { login } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [remember, setRemember] = useState(true);
  const [busy, setBusy] = useState(false);
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(0);
  const timers = useRef([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const later = (fn, ms) => timers.current.push(setTimeout(fn, ms));

  const finish = (e, p) => {
    setBusy(true);
    setError("");
    later(() => {
      const err = login(e, p, remember);
      if (err) {
        setBusy(false);
        setError(err);
        setShake((n) => n + 1);
        return;
      }
      toast(`Welcome back, ${DEMO.name.split(" ")[0]}!`);
      router.replace("/");
    }, 900);
  };

  const submit = (ev) => {
    ev.preventDefault();
    if (busy || typing) return;
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      setShake((n) => n + 1);
      return;
    }
    finish(email, password);
  };

  // types the demo credentials into the form, then signs in
  const instant = () => {
    if (busy || typing) return;
    setError("");
    setEmail("");
    setPassword("");
    setShow(false);
    setTyping(true);
    let i = 0;
    const typeEmail = () => {
      i++;
      setEmail(DEMO.email.slice(0, i));
      if (i < DEMO.email.length) return later(typeEmail, 32);
      let j = 0;
      const typePw = () => {
        j++;
        setPassword(DEMO.password.slice(0, j));
        if (j < DEMO.password.length) return later(typePw, 45);
        setTyping(false);
        later(() => finish(DEMO.email, DEMO.password), 250);
      };
      later(typePw, 150);
    };
    typeEmail();
  };

  const field = "h-12 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm outline-none transition focus:border-brand";

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      {/* ---------------- brand panel ---------------- */}
      <aside className="relative hidden overflow-hidden bg-[#0b1526] text-white lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="anim-float-slow absolute -left-24 -top-24 h-96 w-96 rounded-full bg-orange-500/30 blur-3xl" />
        <div className="anim-float-slow absolute -bottom-32 right-0 h-md w-md rounded-full bg-indigo-500/30 blur-3xl [animation-delay:-6s]" />
        <div className="anim-float-slow absolute left-1/3 top-1/2 h-72 w-72 rounded-full bg-pink-500/20 blur-3xl [animation-delay:-11s]" />
        <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:44px_44px]" />

        <div className="anim-page relative flex items-center gap-3">
          <GiScales size={44} className="text-amber-300" />
          <div className="leading-tight"><p className="text-2xl font-bold">LexPro</p><p className="text-xs text-slate-300">Case Management</p></div>
        </div>

        <div className="relative max-w-lg">
          <h1 className="anim-page text-5xl font-bold leading-[1.1]">
            Run your practice with <span className="text-shine">clarity</span>.
          </h1>
          <p className="anim-page mt-5 text-lg text-slate-300 [animation-delay:0.1s]">
            The case management workspace built for modern advocates and legal teams.
          </p>
          <ul className="mt-9 space-y-5">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <li key={f.title} className="anim-page flex items-start gap-4" style={{ animationDelay: `${0.25 + i * 0.12}s` }}>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/15 backdrop-blur"><Icon size={20} className="text-amber-300" /></span>
                  <span><span className="block font-semibold">{f.title}</span><span className="block text-sm text-slate-400">{f.text}</span></span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="relative flex items-end justify-between">
          <div className="flex gap-4">
            <div className="anim-float-y rounded-2xl bg-white/10 px-5 py-4 ring-1 ring-white/15 backdrop-blur">
              <p className="flex items-center gap-2 text-xs text-slate-300"><Scale size={14} /> Active cases</p>
              <p className="mt-1 text-3xl font-bold">16</p>
            </div>
            <div className="anim-float-y rounded-2xl bg-white/10 px-5 py-4 ring-1 ring-white/15 backdrop-blur [animation-delay:-2.5s]">
              <p className="flex items-center gap-2 text-xs text-slate-300"><CalendarClock size={14} /> Hearings this week</p>
              <p className="mt-1 text-3xl font-bold">5</p>
            </div>
          </div>
          <p className="flex items-center gap-2 text-xs text-slate-400"><ShieldCheck size={14} /> Demo environment</p>
        </div>
      </aside>

      {/* ---------------- form ---------------- */}
      <main className="relative flex items-center justify-center overflow-hidden bg-canvas px-5 py-10 sm:px-10">
        <div className="anim-float-slow absolute -right-20 -top-20 h-72 w-72 rounded-full bg-orange-200/40 blur-3xl lg:hidden" />
        <div key={shake} className={`relative w-full max-w-md ${shake ? "anim-shake" : "anim-page"}`}>
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <GiScales size={40} className="text-amber-500" />
            <div className="leading-tight"><p className="text-2xl font-bold">LexPro</p><p className="text-xs text-slate-500">Case Management</p></div>
          </div>

          <h2 className="text-3xl font-bold">Welcome back</h2>
          <p className="mt-1.5 text-slate-600">Sign in to see your cases, hearings and reminders.</p>

          {/* demo credentials */}
          <div className="anim-gradient mt-6 rounded-2xl bg-linear-to-r from-orange-300 via-pink-300 to-indigo-300 p-px">
            <div className="rounded-2xl bg-orange-50/90 p-4">
              <p className="mb-3 flex items-center gap-2 text-sm font-semibold"><Zap size={15} className="text-brand" /> Demo credentials</p>
              <div className="grid gap-2 sm:grid-cols-2">
                <CopyChip label="Email" value={DEMO.email} />
                <CopyChip label="Password" value={DEMO.password} />
              </div>
              <button
                type="button"
                onClick={instant}
                disabled={busy || typing}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-linear-to-r from-orange-500 to-pink-500 py-2.5 text-sm font-semibold text-white shadow-md shadow-orange-300/50 transition hover:shadow-lg hover:brightness-105 disabled:opacity-60"
              >
                <Zap size={16} /> {typing ? "Filling in..." : "Instant demo login"}
              </button>
            </div>
          </div>

          <div className="my-6 flex items-center gap-4 text-xs text-slate-400"><span className="h-px flex-1 bg-line" />or sign in manually<span className="h-px flex-1 bg-line" /></div>

          <form onSubmit={submit} noValidate className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium">Email address</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input id="email" type="email" autoComplete="username" value={email} onChange={(e) => { setEmail(e.target.value); setError(""); }} placeholder="you@firm.com" className={field} />
              </div>
            </div>
            <div>
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium">Password</label>
              <div className="relative">
                <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input id="password" type={show ? "text" : "password"} autoComplete="current-password" value={password} onChange={(e) => { setPassword(e.target.value); setError(""); }} placeholder="Enter your password" className={`${field} pr-12`} />
                <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-slate-400 hover:text-slate-700">
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex cursor-pointer items-center gap-2 text-slate-600">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} className="h-4 w-4 accent-brand" /> Remember me
              </label>
              <button type="button" onClick={() => toast("Password reset isn't available in the demo. Use the demo credentials above.", "info")} className="font-medium text-brand hover:underline">Forgot password?</button>
            </div>

            {error && <p role="alert" className="anim-fade rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>}

            <button type="submit" disabled={busy || typing} className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-brand text-sm font-semibold text-white shadow-md shadow-orange-300/40 transition hover:bg-brand-dark hover:shadow-lg disabled:opacity-70">
              {busy ? <><Loader2 size={18} className="animate-spin" /> Signing in...</> : <>Sign in <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" /></>}
            </button>
          </form>

          <p className="mt-8 text-center text-xs text-slate-400">&copy; 2026 LexPro. Demo build - sample data only.</p>
        </div>
      </main>
    </div>
  );
}
