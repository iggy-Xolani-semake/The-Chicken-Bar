"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";

interface Stats {
  newOrders: number;
  todaysOrders: number;
  upcomingEvents: number;
  stallApplications: number;
  menuItems: number;
  outOfStock: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);

  useEffect(() => {
    async function load() {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);

      const [newOrders, todaysOrders, upcomingEvents, menuItems, outOfStock] = await Promise.all([
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "new"),
        supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .gte("created_at", startOfDay.toISOString()),
        supabase
          .from("events")
          .select("id", { count: "exact", head: true })
          .eq("status", "upcoming"),
        supabase.from("menu_items").select("id", { count: "exact", head: true }).eq("is_active", true),
        supabase
          .from("menu_items")
          .select("id", { count: "exact", head: true })
          .eq("is_available", false),
      ]);

      setStats({
        newOrders: newOrders.count ?? 0,
        todaysOrders: todaysOrders.count ?? 0,
        upcomingEvents: upcomingEvents.count ?? 0,
        stallApplications: 0, // stall_bookings table not yet built
        menuItems: menuItems.count ?? 0,
        outOfStock: outOfStock.count ?? 0,
      });
    }
    load();
  }, []);

  const cards = stats
    ? [
        { label: "New Orders", value: stats.newOrders, href: "/admin/orders" },
        { label: "Today's Orders", value: stats.todaysOrders, href: "/admin/orders" },
        { label: "Upcoming Events", value: stats.upcomingEvents, href: "/admin/events" },
        { label: "Stall Applications", value: stats.stallApplications, href: "/admin/stalls" },
        { label: "Menu Items", value: stats.menuItems, href: "/admin/menu" },
        { label: "Out of Stock", value: stats.outOfStock, href: "/admin/menu" },
      ]
    : [];

  return (
    <div>
      <h1 className="font-display text-bone text-2xl sm:text-3xl mb-6 sm:mb-8">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 mb-8 sm:mb-10">
        {stats === null
          ? [0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-smoke-light rounded-sm h-20 sm:h-24 animate-pulse" />
            ))
          : cards.map((c) => (
              <Link
                key={c.label}
                href={c.href}
                className="bg-smoke-light border border-bone/10 rounded-sm p-3 sm:p-5 hover:border-flame/60 transition-colors"
              >
                <p className="font-utility text-flame text-2xl sm:text-3xl font-bold">{c.value}</p>
                <p className="font-body text-bone/60 text-xs sm:text-sm mt-1">{c.label}</p>
              </Link>
            ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap">
        <Link
          href="/admin/menu"
          className="inline-flex min-h-11 items-center justify-center text-center font-body text-xs sm:text-sm bg-flame text-bone px-3 sm:px-4 py-2 rounded-sm hover:bg-ember"
        >
          + Add Menu Item
        </Link>
        <Link
          href="/admin/events"
          className="inline-flex min-h-11 items-center justify-center text-center font-body text-xs sm:text-sm bg-flame text-bone px-3 sm:px-4 py-2 rounded-sm hover:bg-ember"
        >
          + Create Event
        </Link>
        <Link
          href="/admin/gallery"
          className="inline-flex min-h-11 items-center justify-center text-center font-body text-xs sm:text-sm bg-flame text-bone px-3 sm:px-4 py-2 rounded-sm hover:bg-ember"
        >
          + Upload Photos
        </Link>
        <Link
          href="/admin/orders"
          className="inline-flex min-h-11 items-center justify-center text-center font-body text-xs sm:text-sm bg-smoke-light border border-bone/20 text-bone px-3 sm:px-4 py-2 rounded-sm hover:border-bone/50"
        >
          View Orders
        </Link>
      </div>
    </div>
  );
}
