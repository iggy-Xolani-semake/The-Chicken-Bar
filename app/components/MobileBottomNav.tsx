"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/cart/CartContext";

const TABS = [
  { href: "/", label: "Home", icon: "🏠" },
  { href: "/menu", label: "Menu", icon: "🍗" },
  { href: "/#upcoming-events", label: "Events", icon: "📅" },
  { href: "/majita-monday", label: "Majita", icon: "🔥" },
];

export default function MobileBottomNav() {
  const pathname = usePathname();
  const { lines } = useCart();
  const itemCount = lines.reduce((sum, l) => sum + l.quantity, 0);

  // Hidden on admin routes — that section has its own nav
  if (pathname.startsWith("/admin")) return null;

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-char-black border-t border-bone/10 flex items-stretch"
      aria-label="Mobile navigation"
    >
      {TABS.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex-1 flex flex-col items-center justify-center py-2 gap-0.5 ${
              isActive ? "text-flame" : "text-bone/50"
            }`}
          >
            <span aria-hidden="true" className="text-lg">
              {tab.icon}
            </span>
            <span className="font-body text-[10px] uppercase tracking-wide">{tab.label}</span>
          </Link>
        );
      })}

      {/* Order — most prominent, per brief. Distinct styling, not just
          another tab, and shows live cart count when non-empty. */}
      <Link
        href={itemCount > 0 ? "/checkout" : "/menu"}
        className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 bg-flame text-bone"
      >
        <span aria-hidden="true" className="text-lg">
          🛒
        </span>
        <span className="font-body text-[10px] uppercase tracking-wide font-bold">
          Order{itemCount > 0 ? ` (${itemCount})` : ""}
        </span>
      </Link>
    </nav>
  );
}
