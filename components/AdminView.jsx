"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UtensilsCrossed, Users, ClipboardList, CalendarOff, Percent, Upload, Download, Pencil, Trash2 } from "lucide-react";
import { Tag } from "@/components/MealCard";
import { FRESHU_LOGO } from "@/components/Shell";
import { MealEditor } from "@/components/MealEditor";
import { createClient } from "@/lib/supabase/client";
import { optionsLabel } from "@/lib/mealOptions";
import { MENUS, mealIsOnMenu, upcomingDeliveryDates } from "@/lib/orderWindow";

function fmtDeliveryDate(dateStr) {
  return new Date(`${dateStr}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function discountValueLabel(coupon) {
  if (!coupon) return "";
  if (coupon.percent_off) return `${coupon.percent_off}% off`;
  if (coupon.amount_off) return `$${(coupon.amount_off / 100).toFixed(2)} off`;
  return "";
}

function discountStatus(promo) {
  if (!promo.active) return { label: "Deactivated", color: "var(--fu-text-muted)" };
  if (promo.expires_at && promo.expires_at * 1000 < Date.now()) return { label: "Expired", color: "#FF5A5F" };
  if (promo.max_redemptions && promo.times_redeemed >= promo.max_redemptions) return { label: "Fully used", color: "#FF5A5F" };
  return { label: "Active", color: "#33D3A3" };
}

export function AdminView({ initialMeals, athletes, orders, initialClosures, initialDiscounts }) {
  const router = useRouter();
  const [tab, setTab] = useState("meals");
  const [mealMenuFilter, setMealMenuFilter] = useState("monday");
  const [orderMenuFilter, setOrderMenuFilter] = useState("all");
  const [meals, setMeals] = useState(initialMeals);
  const [editing, setEditing] = useState(null); // null | 'new' | meal object
  const [closures, setClosures] = useState(initialClosures || []);
  const [newClosure, setNewClosure] = useState({ menu_key: "thursday", delivery_date: "", note: "No delivery this week." });
  const [discounts, setDiscounts] = useState(initialDiscounts || []);
  const [newDiscount, setNewDiscount] = useState({ code: "", type: "percent", value: "", expiresAt: "", maxRedemptions: "" });
  const [discountError, setDiscountError] = useState("");
  const [savingDiscount, setSavingDiscount] = useState(false);

  const deleteMeal = async (id) => {
    if (!window.confirm("Remove this meal from the menu?")) return;
    const supabase = createClient();
    const { error } = await supabase.from("meals").delete().eq("id", id);
    if (!error) {
      setMeals(m => m.filter(x => x.id !== id));
      return;
    }
    // Meals that have ever been ordered or logged can't be hard-deleted
    // (order_items/daily_logs still reference them) — archive instead so
    // it drops off the athlete-facing menu but order history stays intact.
    const { data, error: archiveError } = await supabase.from("meals").update({ is_active: false }).eq("id", id).select().single();
    if (!archiveError) {
      setMeals(m => m.map(x => x.id === id ? data : x));
      window.alert("This meal has order history, so it was archived instead of deleted — it's now hidden from the athlete menu. Use Restore to bring it back.");
    } else {
      window.alert(`Couldn't remove this meal: ${archiveError.message}`);
    }
  };

  const restoreMeal = async (id) => {
    const supabase = createClient();
    const { data, error } = await supabase.from("meals").update({ is_active: true }).eq("id", id).select().single();
    if (!error) setMeals(m => m.map(x => x.id === id ? data : x));
  };

  const addClosure = async () => {
    if (!newClosure.delivery_date) return;
    const supabase = createClient();
    const { data, error } = await supabase.from("menu_closures").insert({
      menu_key: newClosure.menu_key, delivery_date: newClosure.delivery_date, note: newClosure.note.trim() || null,
    }).select().single();
    if (!error) {
      setClosures(c => [...c, data].sort((a, b) => a.delivery_date.localeCompare(b.delivery_date)));
      setNewClosure(c => ({ ...c, delivery_date: "" }));
    } else {
      window.alert(`Couldn't close this delivery: ${error.message}`);
    }
  };

  const deleteClosure = async (id) => {
    const supabase = createClient();
    const { error } = await supabase.from("menu_closures").delete().eq("id", id);
    if (!error) setClosures(c => c.filter(x => x.id !== id));
  };

  const addDiscount = async () => {
    setDiscountError("");
    setSavingDiscount(true);
    try {
      const res = await fetch("/api/staff/discounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newDiscount),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't create code.");
      setDiscounts(d => [data.promotionCode, ...d]);
      setNewDiscount({ code: "", type: "percent", value: "", expiresAt: "", maxRedemptions: "" });
    } catch (e) {
      setDiscountError(e.message);
    } finally {
      setSavingDiscount(false);
    }
  };

  const toggleDiscount = async (promo) => {
    const res = await fetch(`/api/staff/discounts/${promo.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !promo.active }),
    });
    const data = await res.json();
    if (res.ok) setDiscounts(d => d.map(x => x.id === promo.id ? data.promotionCode : x));
  };

  const handleSaved = (saved) => {
    setMeals(m => {
      const exists = m.find(x => x.id === saved.id);
      return exists ? m.map(x => x.id === saved.id ? saved : x) : [...m, saved];
    });
  };

  const exportCSV = () => {
    const rows = [["Order ID", "Athlete", "Delivery", "Week Of", "Meal", "Customizations", "Calories", "Protein", "Carbs", "Fat", "Price"]];
    orders.forEach(o => o.items.forEach(it => {
      rows.push([o.id, o.athlete_name || "Athlete", MENUS[o.delivery_day]?.label || o.delivery_day, o.week_of, it.name, optionsLabel(it.selected_options || []), it.calories, it.protein, it.carbs, it.fat, it.price]);
    }));
    const csv = rows.map(r => r.map(v => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "wellfed_orders_export.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const exit = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/staff/login");
    router.refresh();
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--fu-bg)" }}>
      <div style={{ background: "var(--fu-card)", padding: "18px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={FRESHU_LOGO} alt="FreshU" style={{ height: 26, width: "auto", display: "block" }} />
          <span style={{
            fontFamily: "'Baloo 2',sans-serif", fontWeight: 700, fontSize: 11, color: "#33D3A3",
            letterSpacing: 1, textTransform: "uppercase", background: "#33D3A31f", padding: "3px 8px", borderRadius: 6
          }}>Staff</span>
        </div>
        <button onClick={exit} style={{ background: "#ffffff14", border: "none", borderRadius: 10, padding: "8px 12px", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Exit</button>
      </div>

      <div style={{ display: "flex", gap: 8, padding: "14px 16px 0", overflowX: "auto" }}>
        {[
          { key: "meals", label: "Meals", icon: UtensilsCrossed },
          { key: "athletes", label: "Athletes", icon: Users },
          { key: "orders", label: "Orders", icon: ClipboardList },
          { key: "closures", label: "Closures", icon: CalendarOff },
          { key: "discounts", label: "Discounts", icon: Percent },
        ].map(t => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              display: "flex", alignItems: "center", gap: 6, padding: "9px 14px", borderRadius: 12, border: "none",
              background: tab === t.key ? "var(--fu-cta-bg)" : "var(--fu-card)", color: tab === t.key ? "var(--fu-cta-text)" : "var(--fu-text)",
              fontWeight: 700, fontSize: 13, cursor: "pointer", whiteSpace: "nowrap"
            }}><Icon size={15} /> {t.label}</button>
          );
        })}
      </div>

      <div style={{ padding: "16px 16px 40px", maxWidth: 900, margin: "0 auto" }}>
        {tab === "meals" && (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              {[["monday", "Monday Delivery"], ["thursday", "Thursday Delivery"]].map(([key, label]) => (
                <button key={key} onClick={() => setMealMenuFilter(key)} style={{
                  padding: "9px 14px", borderRadius: 12,
                  border: mealMenuFilter === key ? "1.5px solid var(--fu-cta-bg)" : "1.5px solid var(--fu-border)",
                  background: mealMenuFilter === key ? "var(--fu-cta-bg)" : "var(--fu-card)",
                  color: mealMenuFilter === key ? "var(--fu-cta-text)" : "var(--fu-text)",
                  fontWeight: 700, fontSize: 12.5, cursor: "pointer"
                }}>
                  {label}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 13, color: "var(--fu-text-secondary)" }}>{meals.filter(m => m.is_active && mealIsOnMenu(m, mealMenuFilter)).length} meals on this menu{meals.some(m => !m.is_active && mealIsOnMenu(m, mealMenuFilter)) && ` · ${meals.filter(m => !m.is_active && mealIsOnMenu(m, mealMenuFilter)).length} archived`}</div>
              <button onClick={() => setEditing("new")} style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--fu-cta-bg)", border: "none", borderRadius: 12, padding: "9px 14px", color: "var(--fu-cta-text)", fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>
                <Upload size={14} /> Add meal
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 12 }}>
              {meals.filter(m => mealIsOnMenu(m, mealMenuFilter)).map(m => (
                <div key={m.id} style={{ background: "var(--fu-card)", borderRadius: 18, padding: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.3)", opacity: m.is_active ? 1 : 0.55 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: "var(--fu-card-alt)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, overflow: "hidden" }}>
                      {m.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.photo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : m.emoji}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ fontWeight: 700, fontSize: 13.5, color: "var(--fu-text)" }}>{m.name}</div>
                        {!m.is_active && <Tag label="Archived" />}
                        {m.on_monday_menu && m.on_thursday_menu && <Tag label="Both menus" />}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--fu-text-muted)" }}>{m.category} · ${Number(m.price).toFixed(2)}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                    <Tag label={`${m.calories} cal`} /><Tag label={`${m.protein}g P`} /><Tag label={`${m.carbs}g C`} /><Tag label={`${m.fat}g F`} />
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                    <button onClick={() => setEditing(m)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px", borderRadius: 10, border: "1.5px solid var(--fu-border)", background: "var(--fu-card-alt)", color: "var(--fu-text)", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                      <Pencil size={13} /> Edit
                    </button>
                    {m.is_active ? (
                      <button onClick={() => deleteMeal(m.id)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 10px", borderRadius: 10, border: "1.5px solid rgba(255,90,95,0.35)", background: "var(--fu-card-alt)", color: "#FF5A5F", cursor: "pointer" }}>
                        <Trash2 size={13} />
                      </button>
                    ) : (
                      <button onClick={() => restoreMeal(m.id)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px", borderRadius: 10, border: "1.5px solid #fff", background: "var(--fu-card-alt)", color: "#fff", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
                        Restore
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === "athletes" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {athletes.map(a => (
              <div key={a.id} style={{ background: "var(--fu-card)", borderRadius: 16, padding: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.3)", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: "50%", background: "var(--fu-card-alt)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800 }}>{(a.name || "A")[0]}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13.5, color: "var(--fu-text)" }}>{a.name}</div>
                  <div style={{ fontSize: 11.5, color: "var(--fu-text-muted)" }}>{a.school || "—"} · {a.sport || "—"}</div>
                </div>
                <div style={{ fontSize: 11.5, color: "var(--fu-text-secondary)" }}>{a.email}</div>
              </div>
            ))}
          </div>
        )}

        {tab === "orders" && (
          <>
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              {[["all", "All"], ["monday", "Monday Delivery"], ["thursday", "Thursday Delivery"]].map(([key, label]) => (
                <button key={key} onClick={() => setOrderMenuFilter(key)} style={{
                  padding: "9px 14px", borderRadius: 12,
                  border: orderMenuFilter === key ? "1.5px solid var(--fu-cta-bg)" : "1.5px solid var(--fu-border)",
                  background: orderMenuFilter === key ? "var(--fu-cta-bg)" : "var(--fu-card)",
                  color: orderMenuFilter === key ? "var(--fu-cta-text)" : "var(--fu-text)",
                  fontWeight: 700, fontSize: 12.5, cursor: "pointer"
                }}>
                  {label}
                </button>
              ))}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 13, color: "var(--fu-text-secondary)" }}>{orders.filter(o => orderMenuFilter === "all" || o.delivery_day === orderMenuFilter).length} orders</div>
              <button onClick={exportCSV} style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--fu-cta-bg)", border: "none", borderRadius: 12, padding: "9px 14px", color: "var(--fu-cta-text)", fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>
                <Download size={14} /> Export for Well Fed
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {orders.filter(o => orderMenuFilter === "all" || o.delivery_day === orderMenuFilter).map(o => (
                <div key={o.id} style={{ background: "var(--fu-card)", borderRadius: 16, padding: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.3)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5, color: "var(--fu-text)" }}>{o.athlete_name || "Athlete"} · {MENUS[o.delivery_day]?.label || "Order"} · Week of {o.week_of}</div>
                    <span style={{ fontSize: 11, fontWeight: 800, color: "var(--fu-text-secondary)" }}>{o.status}</span>
                  </div>
                  <div style={{ fontSize: 11.5, color: "var(--fu-text-muted)", marginTop: 4 }}>
                    {o.items.map(i => i.selected_options?.length ? `${i.name} (${optionsLabel(i.selected_options)})` : i.name).join(", ")}
                  </div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, marginTop: 6, color: "var(--fu-text)" }}>${Number(o.total).toFixed(2)}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === "closures" && (
          <>
            <div style={{ background: "var(--fu-card)", borderRadius: 16, padding: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.3)", marginBottom: 16 }}>
              <div style={{ fontFamily: "'Baloo 2',sans-serif", fontWeight: 800, fontSize: 15, color: "var(--fu-text)", marginBottom: 4 }}>Close a delivery</div>
              <div style={{ fontSize: 11.5, color: "var(--fu-text-muted)", marginBottom: 12 }}>Skips one specific week&apos;s delivery (holiday, supplier issue) — the following week resumes normally.</div>
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                {[["monday", "Monday Delivery"], ["thursday", "Thursday Delivery"]].map(([key, label]) => (
                  <button key={key} onClick={() => setNewClosure(c => ({ ...c, menu_key: key, delivery_date: "" }))} style={{
                    flex: 1, padding: "9px 10px", borderRadius: 12,
                    border: newClosure.menu_key === key ? "1.5px solid var(--fu-cta-bg)" : "1.5px solid var(--fu-border)",
                    background: newClosure.menu_key === key ? "var(--fu-cta-bg)" : "var(--fu-card-alt)",
                    color: newClosure.menu_key === key ? "var(--fu-cta-text)" : "var(--fu-text-muted)",
                    fontWeight: 700, fontSize: 12.5, cursor: "pointer"
                  }}>
                    {label}
                  </button>
                ))}
              </div>
              <select value={newClosure.delivery_date} onChange={e => setNewClosure(c => ({ ...c, delivery_date: e.target.value }))}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid var(--fu-border)", background: "var(--fu-card-alt)", color: "var(--fu-text)", fontSize: 13, marginBottom: 10 }}>
                <option value="">Choose a delivery date…</option>
                {upcomingDeliveryDates(newClosure.menu_key, 6)
                  .filter(d => !closures.some(c => c.menu_key === newClosure.menu_key && c.delivery_date === d))
                  .map(d => <option key={d} value={d}>{fmtDeliveryDate(d)}</option>)}
              </select>
              <input value={newClosure.note} onChange={e => setNewClosure(c => ({ ...c, note: e.target.value }))} placeholder="Note athletes will see"
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid var(--fu-border)", background: "var(--fu-card-alt)", color: "var(--fu-text)", fontSize: 13, marginBottom: 12 }} />
              <button onClick={addClosure} disabled={!newClosure.delivery_date} style={{
                width: "100%", padding: 12, borderRadius: 12, border: "none",
                background: newClosure.delivery_date ? "var(--fu-cta-bg)" : "var(--fu-card-alt)",
                color: newClosure.delivery_date ? "var(--fu-cta-text)" : "var(--fu-text-muted)",
                fontWeight: 700, fontSize: 13, cursor: newClosure.delivery_date ? "pointer" : "default"
              }}>
                Close this delivery
              </button>
            </div>

            <div style={{ fontSize: 13, color: "var(--fu-text-secondary)", marginBottom: 10 }}>{closures.length} upcoming closure{closures.length === 1 ? "" : "s"}</div>
            {closures.length === 0 ? (
              <div style={{ background: "var(--fu-card)", borderRadius: 16, padding: 20, textAlign: "center", color: "var(--fu-text-muted)", fontSize: 13 }}>
                No deliveries are closed right now.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {closures.map(c => (
                  <div key={c.id} style={{ background: "var(--fu-card)", borderRadius: 16, padding: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.3)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13.5, color: "var(--fu-text)" }}>{MENUS[c.menu_key]?.label} · {fmtDeliveryDate(c.delivery_date)}</div>
                      {c.note && <div style={{ fontSize: 11.5, color: "var(--fu-text-muted)", marginTop: 2 }}>{c.note}</div>}
                    </div>
                    <button onClick={() => deleteClosure(c.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, flexShrink: 0 }}>
                      <Trash2 size={15} color="#FF5A5F" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {tab === "discounts" && (
          <>
            <div style={{ background: "var(--fu-card)", borderRadius: 16, padding: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.3)", marginBottom: 16 }}>
              <div style={{ fontFamily: "'Baloo 2',sans-serif", fontWeight: 800, fontSize: 15, color: "var(--fu-text)", marginBottom: 4 }}>Create a discount code</div>
              <div style={{ fontSize: 11.5, color: "var(--fu-text-muted)", marginBottom: 12 }}>Athletes enter this on the secure checkout page — no extra steps in the app.</div>
              <input value={newDiscount.code} onChange={e => setNewDiscount(d => ({ ...d, code: e.target.value.toUpperCase() }))} placeholder="Code, e.g. WELCOME10"
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: "1.5px solid var(--fu-border)", background: "var(--fu-card-alt)", color: "var(--fu-text)", fontSize: 13, marginBottom: 10, textTransform: "uppercase" }} />
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                {[["percent", "% off"], ["amount", "$ off"]].map(([key, label]) => (
                  <button key={key} onClick={() => setNewDiscount(d => ({ ...d, type: key }))} style={{
                    flex: 1, padding: "9px 10px", borderRadius: 12,
                    border: newDiscount.type === key ? "1.5px solid var(--fu-cta-bg)" : "1.5px solid var(--fu-border)",
                    background: newDiscount.type === key ? "var(--fu-cta-bg)" : "var(--fu-card-alt)",
                    color: newDiscount.type === key ? "var(--fu-cta-text)" : "var(--fu-text-muted)",
                    fontWeight: 700, fontSize: 12.5, cursor: "pointer"
                  }}>
                    {label}
                  </button>
                ))}
                <input type="number" value={newDiscount.value} onChange={e => setNewDiscount(d => ({ ...d, value: e.target.value }))}
                  placeholder={newDiscount.type === "percent" ? "10" : "5.00"}
                  style={{ flex: 1, padding: "9px 10px", borderRadius: 12, border: "1.5px solid var(--fu-border)", background: "var(--fu-card-alt)", color: "var(--fu-text)", fontSize: 13 }} />
              </div>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10.5, color: "var(--fu-text-muted)", marginBottom: 4 }}>Expires (optional)</div>
                  <input type="date" value={newDiscount.expiresAt} onChange={e => setNewDiscount(d => ({ ...d, expiresAt: e.target.value }))}
                    style={{ width: "100%", padding: "9px 10px", borderRadius: 10, border: "1.5px solid var(--fu-border)", background: "var(--fu-card-alt)", color: "var(--fu-text)", fontSize: 12.5 }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10.5, color: "var(--fu-text-muted)", marginBottom: 4 }}>Max uses (optional)</div>
                  <input type="number" value={newDiscount.maxRedemptions} onChange={e => setNewDiscount(d => ({ ...d, maxRedemptions: e.target.value }))} placeholder="Unlimited"
                    style={{ width: "100%", padding: "9px 10px", borderRadius: 10, border: "1.5px solid var(--fu-border)", background: "var(--fu-card-alt)", color: "var(--fu-text)", fontSize: 12.5 }} />
                </div>
              </div>
              {discountError && <div style={{ color: "#FF5A5F", fontSize: 12.5, marginBottom: 10, fontWeight: 600 }}>{discountError}</div>}
              <button onClick={addDiscount} disabled={!newDiscount.code || !newDiscount.value || savingDiscount} style={{
                width: "100%", padding: 12, borderRadius: 12, border: "none",
                background: newDiscount.code && newDiscount.value ? "var(--fu-cta-bg)" : "var(--fu-card-alt)",
                color: newDiscount.code && newDiscount.value ? "var(--fu-cta-text)" : "var(--fu-text-muted)",
                fontWeight: 700, fontSize: 13, cursor: newDiscount.code && newDiscount.value ? "pointer" : "default", opacity: savingDiscount ? 0.7 : 1
              }}>
                {savingDiscount ? "Creating…" : "Create code"}
              </button>
            </div>

            <div style={{ fontSize: 13, color: "var(--fu-text-secondary)", marginBottom: 10 }}>{discounts.length} code{discounts.length === 1 ? "" : "s"}</div>
            {discounts.length === 0 ? (
              <div style={{ background: "var(--fu-card)", borderRadius: 16, padding: 20, textAlign: "center", color: "var(--fu-text-muted)", fontSize: 13 }}>
                No discount codes yet.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {discounts.map(promo => {
                  const status = discountStatus(promo);
                  return (
                    <div key={promo.id} style={{ background: "var(--fu-card)", borderRadius: 16, padding: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.3)", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontFamily: "'Baloo 2',sans-serif", fontWeight: 800, fontSize: 14, color: "var(--fu-text)", letterSpacing: 0.5 }}>{promo.code}</span>
                          <span style={{ fontSize: 10.5, fontWeight: 800, color: status.color }}>{status.label}</span>
                        </div>
                        <div style={{ fontSize: 11.5, color: "var(--fu-text-muted)", marginTop: 2 }}>
                          {discountValueLabel(promo.coupon)} · used {promo.times_redeemed}{promo.max_redemptions ? `/${promo.max_redemptions}` : ""}
                          {promo.expires_at && ` · expires ${new Date(promo.expires_at * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                        </div>
                      </div>
                      <button onClick={() => toggleDiscount(promo)} style={{
                        flexShrink: 0, padding: "7px 12px", borderRadius: 10, fontWeight: 700, fontSize: 11.5, cursor: "pointer",
                        border: promo.active ? "1.5px solid rgba(255,90,95,0.35)" : "1.5px solid #fff",
                        background: "var(--fu-card-alt)", color: promo.active ? "#FF5A5F" : "#fff"
                      }}>
                        {promo.active ? "Deactivate" : "Reactivate"}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {editing && (
        <MealEditor meal={editing === "new" ? null : editing} defaultDeliveryDay={mealMenuFilter} onCancel={() => setEditing(null)} onSaved={handleSaved} />
      )}
    </div>
  );
}
