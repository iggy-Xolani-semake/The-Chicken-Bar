"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { getCurrentAdminStatus, signOutAdmin } from "@/lib/supabase/adminAuth";
import AdminServiceWorker from "./components/AdminServiceWorker";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/menu", label: "Menu" },
  { href: "/admin/events", label: "Events" },
  { href: "/admin/gallery", label: "Gallery" },
  { href: "/admin/reviews", label: "Customer Reviews" },
  { href: "/admin/stalls", label: "Stall Bookings" },
  { href: "/admin/settings", label: "Restaurant Settings" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const isLoginPage = pathname === "/admin/login";
  const currentPage = NAV_ITEMS.find((item) => item.href === pathname)?.label ?? "Admin";

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

  function closeMenu() {
    setMenuOpen(false);
  }

  async function handleSignOut() {
    await signOutAdmin();
    closeMenu();
    router.push("/admin/login");
  }

  if (isLoginPage) return <>{children}</>;

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <p className="font-body text-bone/50">Checking access...</p>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <>
      <AdminServiceWorker />
      <div className="min-h-screen bg-smoke md:flex">
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-bone/10 bg-smoke-light px-4 py-3 md:hidden">
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          aria-label="Open admin navigation"
          aria-controls="admin-navigation"
          aria-expanded={menuOpen}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-sm border border-bone/20 text-bone hover:border-flame focus-visible:outline focus-visible:outline-3 focus-visible:outline-char"
        >
          <span className="text-xl leading-none" aria-hidden="true">☰</span>
        </button>
        <div className="min-w-0 text-center">
          <p className="font-display text-flame text-lg leading-tight">CB Admin</p>
          <p className="truncate font-body text-xs text-bone/50">{currentPage}</p>
        </div>
        <Link
          href="/admin/orders"
          aria-label="Open orders"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-sm border border-bone/20 font-utility text-xs text-bone hover:border-flame focus-visible:outline focus-visible:outline-3 focus-visible:outline-char"
        >
          ORD
        </Link>
      </header>

      {menuOpen && (
        <button
          type="button"
          aria-label="Close admin navigation"
          onClick={closeMenu}
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
        />
      )}

      <aside
        id="admin-navigation"
        className={`fixed inset-y-0 left-0 z-50 flex w-[min(19rem,calc(100vw-2rem))] flex-col border-r border-bone/10 bg-smoke-light p-4 shadow-2xl transition-transform duration-200 md:static md:w-56 md:translate-x-0 md:shadow-none ${
          menuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="mb-6 flex items-center justify-between px-2 md:block">
          <div>
            <h2 className="font-display text-flame text-xl">Chicken Bar</h2>
            <p className="font-body text-xs text-bone/45 md:mt-1">Admin workspace</p>
          </div>
          <button
            type="button"
            onClick={closeMenu}
            aria-label="Close admin navigation"
            className="grid h-11 w-11 place-items-center rounded-sm border border-bone/20 text-bone md:hidden"
          >
            <span className="text-2xl leading-none" aria-hidden="true">×</span>
          </button>
        </div>

        <nav className="flex-1" aria-label="Admin navigation">
          <ul className="space-y-1">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={closeMenu}
                  className={`block rounded-sm px-3 py-3 font-body text-base transition-colors md:py-2 md:text-sm ${
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
        </nav>

        <button
          type="button"
          onClick={handleSignOut}
          className="mt-4 min-h-11 rounded-sm border border-bone/15 px-3 py-3 text-left font-body text-base text-bone/65 hover:border-ember/50 hover:text-ember md:border-0 md:px-3 md:py-2 md:text-sm"
        >
          Sign Out
        </button>
      </aside>

        <main className="min-w-0 flex-1 px-4 py-5 pb-10 sm:px-6 sm:py-7 md:p-8">
          {children}
        </main>
      </div>
    </>
  );
}
