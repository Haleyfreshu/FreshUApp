import { createClient } from "@/lib/supabase/server";
import { OrderCard } from "@/components/OrderCard";
import { EmptyState } from "@/components/Fields";

export default async function OrdersPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: orders } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .eq("athlete_id", user.id)
    .order("created_at", { ascending: false });

  const normalized = (orders || []).map(o => ({ ...o, items: o.order_items || [] }));
  const current = normalized.filter(o => o.status === "This Week");
  const past = normalized.filter(o => o.status !== "This Week");

  return (
    <div style={{ padding: "18px 20px 20px" }}>
      <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 22, color: "var(--fu-text)" }}>Orders</div>

      <div style={{ marginTop: 16 }}>
        <div style={{ fontWeight: 800, fontSize: 13, color: "var(--fu-label)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Current</div>
        {current.length === 0 && <EmptyState text="No active order. Head to the menu to fuel up this week." />}
        {current.map(o => <OrderCard key={o.id} order={o} />)}
      </div>

      <div style={{ marginTop: 22 }}>
        <div style={{ fontWeight: 800, fontSize: 13, color: "var(--fu-label)", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>Previous</div>
        {past.length === 0 && <EmptyState text="Past orders will show up here." />}
        {past.map(o => <OrderCard key={o.id} order={o} />)}
      </div>
    </div>
  );
}
