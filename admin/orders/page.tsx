"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";

type OrderStatus =
  | "new"
  | "confirmed"
  | "preparing"
  | "ready"
  | "out_for_delivery"
  | "completed"
  | "cancelled";

interface OrderRow {
  id: string;
  order_number: string;
  customer_name: string;
  customer_phone: string;
  order_fulfillment_type: string;
  total: number;
  status: OrderStatus;
  created_at: string;
  order_items: { item_name_snapshot: string; quantity: number }[];
}

const STATUS_FLOW: OrderStatus[] = [
  "new",
  "confirmed",
  "preparing",
  "ready",
  "out_for_delivery",
  "completed",
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderRow[] | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    const { data } = await supabase
      .from("orders")
      .select(`*, order_items (item_name_snapshot, quantity)`)
      .order("created_at", { ascending: false })
      .limit(50);
    setOrders((data as OrderRow[]) ?? []);
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  async function updateStatus(orderId: string, status: OrderStatus) {
    await supabase.from("orders").update({ status }).eq("id", orderId);
    loadOrders();
  }

  return (
    <div>
      <h1 className="font-display text-bone text-3xl mb-8">Orders</h1>

      {orders === null && <p className="font-body text-bone/50">Loading...</p>}
      {orders !== null && orders.length === 0 && (
        <p className="font-body text-bone/50">No orders yet.</p>
      )}

      <div className="space-y-3">
        {orders?.map((order) => (
          <div key={order.id} className="bg-smoke-light border border-bone/10 rounded-sm p-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <span className="font-utility text-flame font-bold">{order.order_number}</span>
                <span className="font-body text-bone/70 ml-3">{order.customer_name}</span>
                <span className="font-body text-bone/40 text-sm ml-3">
                  {order.order_fulfillment_type}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-utility text-bone">R{order.total}</span>
                <span
                  className={`font-body text-xs uppercase px-2 py-1 rounded-sm ${
                    order.status === "new"
                      ? "bg-flame text-bone"
                      : order.status === "cancelled"
                      ? "bg-ember/20 text-ember"
                      : "bg-bone/10 text-bone/70"
                  }`}
                >
                  {order.status.replace(/_/g, " ")}
                </span>
                <button
                  type="button"
                  onClick={() => setExpandedId(expandedId === order.id ? null : order.id)}
                  className="font-body text-sm text-bone/50 hover:text-bone"
                >
                  {expandedId === order.id ? "Hide" : "View"}
                </button>
              </div>
            </div>

            {expandedId === order.id && (
              <div className="mt-4 pt-4 border-t border-bone/10">
                <p className="font-body text-bone/70 text-sm mb-1">
                  Phone: {order.customer_phone}
                </p>
                <ul className="font-body text-bone/70 text-sm mb-4">
                  {order.order_items.map((item, i) => (
                    <li key={i}>
                      {item.quantity} &times; {item.item_name_snapshot}
                    </li>
                  ))}
                </ul>

                <div className="flex flex-wrap gap-2">
                  {STATUS_FLOW.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => updateStatus(order.id, s)}
                      disabled={order.status === s}
                      className="font-body text-xs uppercase px-3 py-1.5 rounded-sm bg-smoke border border-bone/20 text-bone/70 hover:border-flame disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Mark {s.replace(/_/g, " ")}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => updateStatus(order.id, "cancelled")}
                    className="font-body text-xs uppercase px-3 py-1.5 rounded-sm bg-smoke border border-ember/40 text-ember hover:bg-ember/10"
                  >
                    Cancel Order
                  </button>
                  <button
                    type="button"
                    onClick={() => window.print()}
                    className="font-body text-xs uppercase px-3 py-1.5 rounded-sm bg-smoke border border-bone/20 text-bone/70 hover:border-bone/50"
                  >
                    Print Order
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
