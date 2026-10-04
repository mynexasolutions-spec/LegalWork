"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { GiScales } from "react-icons/gi";
import Sidebar from "@/components/Sidebar";
import Topbar from "@/components/Topbar";
import { useAuth } from "@/lib/auth";
import ResponsiveTables from "@/components/ResponsiveTables";

function Splash() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-sidebar">
      <GiScales size={56} className="animate-pulse text-amber-300" />
    </div>
  );
}

// the login page renders bare; everything else needs a session
export default function AppShell({ children }) {
  const { user, ready } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const onLogin = pathname === "/login";

  useEffect(() => {
    if (!ready) return;
    if (!user && !onLogin) {
      document.cookie = "lexpro_session=; path=/; max-age=0"; // keep the proxy in sync with the real session
      router.replace("/login");
    }
    if (user && onLogin) router.replace("/");
  }, [ready, user, onLogin, router]);

  if (!ready) return <Splash />;
  if (onLogin) return user ? <Splash /> : children;
  if (!user) return <Splash />;

  return (
    <div className="flex min-h-screen">
      <ResponsiveTables />
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
