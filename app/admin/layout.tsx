"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { getCurrentAdminStatus, signOutAdmin } from "@/lib/supabase/adminAuth";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/menu", label: "Menu" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/gallery", label: "Gallery" },
  { href: "/admin/stalls", label: "Stall Bookings" },
  { href: "/admin/settings", label: "Restaurant Settings" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) return;

    let cancelled = false;
    void getCurrentAdminStatus().then(({ isAdmin: ok }) => {
      if (cancelled) return;
      setIsAdmin(ok);
      setChecking(false);
      if (!ok) router.replace("/admin/login");
    });

    return () => {
      cancelled = true;
    };
  }, [isLoginPage, router]);

  if (isLoginPage) return <>{children}</>;

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="font-body text-bone/50">Checking access...</p>
      </div>
    );
  }

  if (!isAdmin) return null; // redirect already in flight

  return (
    <div className="min-h-screen flex">
      <nav className="w-56 bg-smoke-light border-r border-bone/10 p-4 flex flex-col">
        <h2 className="font-display text-flame text-xl mb-6 px-2">Admin</h2>
        <ul className="space-y-1 flex-1">
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={`block px-3 py-2 rounded-sm font-body text-sm ${
                  pathname === item.href
                    ? "bg-flame text-bone"
                    : "text-bone/70 hover:bg-smoke hover:text-bone"
                }`}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <button
          type="button"
          onClick={async () => {
            await signOutAdmin();
            router.push("/admin/login");
          }}
          className="font-body text-sm text-bone/50 hover:text-ember px-3 py-2 text-left"
        >
          Sign Out
        </button>
      </nav>
      <div className="flex-1 p-8 overflow-y-auto">{children}</div>
    </div>
  );
}
