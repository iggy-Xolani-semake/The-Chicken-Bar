"use client";

import { usePathname } from "next/navigation";
import { CartProvider } from "@/lib/cart/CartContext";
import CartDrawer from "@/app/components/CartDrawer";
import Header from "@/app/components/Header";
import MobileBottomNav from "@/app/components/MobileBottomNav";

export default function SiteChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdminRoute = pathname.startsWith("/admin");

  if (isAdminRoute) return <>{children}</>;

  return (
    <CartProvider>
      <Header />
      <div className="flex-1 flex flex-col pb-16 md:pb-0">{children}</div>
      <MobileBottomNav />
      <CartDrawer />
    </CartProvider>
  );
}
