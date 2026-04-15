"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { clearToken } from "@/lib/api";
import { getStoredUser } from "@/lib/auth";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const isAuthPage = pathname === "/login";
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("tedbirge_token")
        : null;

    if (!token && !isAuthPage) {
      router.replace("/login");
      return;
    }

    if (token && pathname === "/") {
      router.replace("/dashboard");
      return;
    }

    setReady(true);
  }, [pathname, router]);

  function logout() {
    clearToken();
    router.replace("/login");
  }

  const user = getStoredUser();

  if (!ready && pathname !== "/login") {
    return <div className="p-6">Yukleniyor...</div>;
  }

  if (pathname === "/login") {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div>
            <div className="text-xl font-bold">Tedbirge AI Panel</div>
            <div className="text-sm text-slate-500">
              {user?.fullName || "Kullanici"} {user?.role ? -  : ""}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="rounded-lg px-3 py-2 hover:bg-slate-100">
              Dashboard
            </Link>
            <Link href="/leads" className="rounded-lg px-3 py-2 hover:bg-slate-100">
              Leads
            </Link>
            <button
              onClick={logout}
              className="rounded-lg bg-slate-900 px-4 py-2 text-white"
            >
              Cikis
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-6 py-6">{children}</main>
    </div>
  );
}
