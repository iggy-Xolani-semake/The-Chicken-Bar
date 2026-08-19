import { supabase } from "@/lib/supabase/client";

/**
 * Generates the next order number for today in CB-YYYYMMDD-NNN format,
 * per brief example: CB-20260803-001.
 *
 * This is NOT a raw Postgres sequence (see note in 02_orders.sql) because
 * a global sequence produces ever-increasing numbers (CB-20260803-4821
 * after enough total orders), which breaks the daily-reset format the
 * brief specifies. Instead, this counts today's existing orders and
 * increments — meaning the actual uniqueness guarantee comes from the
 * database's `unique` constraint on order_number, not from this function
 * being perfectly race-condition-free. See race condition note below.
 */
export async function generateOrderNumber(): Promise<string> {
  const now = new Date();
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(
    now.getDate()
  ).padStart(2, "0")}`;

  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfDay = new Date(startOfDay);
  endOfDay.setDate(endOfDay.getDate() + 1);

  const { count, error } = await supabase
    .from("orders")
    .select("*", { count: "exact", head: true })
    .gte("created_at", startOfDay.toISOString())
    .lt("created_at", endOfDay.toISOString());

  if (error) {
    throw new Error(`Failed to count today's orders: ${error.message}`);
  }

  const nextSequence = (count ?? 0) + 1;
  const sequencePart = String(nextSequence).padStart(3, "0");

  return `CB-${datePart}-${sequencePart}`;
}
