"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, X } from "lucide-react";
import { GiScales } from "react-icons/gi";
import { navMain, navSecondary } from "@/lib/data";
import { useUI } from "@/components/ui/UIContext";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";

function NavItem({ item, active }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
        active ? "bg-peach text-sidebar shadow-sm" : "text-slate-300 hover:translate-x-0.5 hover:bg-sidebar-hover hover:text-white"
      }`}
    >
      <Icon size={20} strokeWidth={1.75} />
      {item.label}
    </Link>
  );
}

function AdminCard() {
  const toast = useToast();
  const router = useRouter();
  const { logout } = useAuth();
  return (
    <div className="mt-auto rounded-xl bg-white/5 p-3">
      <Link href="/team/m0" className="flex items-center gap-3 rounded-lg p-1 hover:bg-white/5">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#9a4a3a] text-sm font-semibold text-white">H</span>
        <span className="min-w-0 leading-tight">
          <span className="block truncate text-sm font-semibold text-white">Harsh Kumar</span>
          <span className="block text-xs text-slate-400">Administrator</span>
        </span>
      </Link>
      <button
        onClick={() => { logout(); toast("You have been logged out", "info"); router.replace("/login"); }}
        className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 py-2 text-xs font-medium text-slate-300 hover:bg-white/5 hover:text-white"
      >
        <LogOut size={14} /> Log out
      </button>
    </div>
  );
}

function Content({ onNavigate, onClose }) {
  const pathname = usePathname();
  const { logo } = useStore();
  const isActive = (href) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));

  return (
    <>
      <div className="sticky top-0 z-10 -mx-2 mb-2 flex items-center justify-between gap-3 bg-sidebar px-4 pb-4 pt-5">
        <div className="flex min-w-0 items-center gap-3">
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt="Logo" className="h-10 w-10 rounded-lg bg-white/10 object-contain p-0.5" />
        ) : <GiScales size={38} className="text-amber-300" />}
        <div className="leading-tight">
          <p className="text-xl font-bold text-white">LexPro</p>
          <p className="text-xs text-slate-300">Case Management</p>
        </div>
        </div>
        {onClose && (
          <button onClick={onClose} aria-label="Close menu" className="shrink-0 rounded-lg p-1.5 text-slate-300 hover:bg-white/10 hover:text-white"><X size={20} /></button>
        )}
      </div>

      <nav className="flex flex-col gap-1" onClick={onNavigate}>
        {navMain.map((item) => <NavItem key={item.href} item={item} active={isActive(item.href)} />)}
      </nav>

      <hr className="mx-2 my-4 border-white/10" />

      <nav className="mb-6 flex flex-col gap-1" onClick={onNavigate}>
        {navSecondary.map((item) => <NavItem key={item.href} item={item} active={isActive(item.href)} />)}
      </nav>

      <AdminCard />
    </>
  );
}

export default function Sidebar() {
  const { navOpen, setNavOpen } = useUI();
  const pathname = usePathname();

  // close the mobile drawer whenever the route changes
  useEffect(() => setNavOpen(false), [pathname, setNavOpen]);

  return (
    <>
      <aside className="scroll-dark sticky top-0 hidden h-screen w-57.5 shrink-0 flex-col overflow-y-auto bg-sidebar px-2 pb-5 lg:flex">
        <Content />
      </aside>

      {navOpen && (
        <div className="anim-fade fixed inset-0 z-40 bg-slate-900/50 lg:hidden" onClick={() => setNavOpen(false)}>
          <aside className="scroll-dark anim-slide-l flex h-full w-64 flex-col overflow-y-auto bg-sidebar px-2 pb-5" onClick={(e) => e.stopPropagation()}>
            <Content onClose={() => setNavOpen(false)} />
          </aside>
        </div>
      )}
    </>
  );
}
