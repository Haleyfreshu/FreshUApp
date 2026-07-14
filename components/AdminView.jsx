"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { UtensilsCrossed, Users, ClipboardList, Upload, Download, Pencil, Trash2 } from "lucide-react";
import { Tag } from "@/components/MealCard";
import { FRESHU_LOGO } from "@/components/Shell";
import { MealEditor } from "@/components/MealEditor";
import { createClient } from "@/lib/supabase/client";
import { optionsLabel } from "@/lib/mealOptions";

export function AdminView({ initialMeals, athletes, orders }) {
  const router = useRouter();
  const [tab, setTab] = useState("meals");
  const [meals, setMeals] = useState(initialMeals);
  const [editing, setEditing] = useState(null); // null | 'new' | meal object

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

  const handleSaved = (saved) => {
    setMeals(m => {
      const exists = m.find(x => x.id === saved.id);
      return exists ? m.map(x => x.id === saved.id ? saved : x) : [...m, saved];
    });
  };

  const exportCSV = () => {
    const rows = [["Order ID", "Athlete", "Week Of", "Meal", "Customizations", "Calories", "Protein", "Carbs", "Fat", "Price"]];
    orders.forEach(o => o.items.forEach(it => {
      rows.push([o.id, o.athlete_name || "Athlete", o.week_of, it.name, optionsLabel(it.selected_options || []), it.calories, it.protein, it.carbs, it.fat, it.price]);
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
            fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, fontSize: 11, color: "#33D3A3",
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 13, color: "var(--fu-text-secondary)" }}>{meals.filter(m => m.is_active).length} meals on this week&apos;s menu{meals.some(m => !m.is_active) && ` · ${meals.filter(m => !m.is_active).length} archived`}</div>
              <button onClick={() => setEditing("new")} style={{ display: "flex", alignItems: "center", gap: 6, background: "#2A3EFF", border: "none", borderRadius: 12, padding: "9px 14px", color: "#fff", fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>
                <Upload size={14} /> Add meal
              </button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 12 }}>
              {meals.map(m => (
                <div key={m.id} style={{ background: "var(--fu-card)", borderRadius: 18, padding: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.3)", opacity: m.is_active ? 1 : 0.55 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: `${m.color}1a`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, overflow: "hidden" }}>
                      {m.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.photo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : m.emoji}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <div style={{ fontWeight: 700, fontSize: 13.5, color: "var(--fu-text)" }}>{m.name}</div>
                        {!m.is_active && <Tag label="Archived" />}
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
                      <button onClick={() => restoreMeal(m.id)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px", borderRadius: 10, border: "1.5px solid #2A3EFF", background: "var(--fu-card-alt)", color: "#2A3EFF", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
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
                <div style={{ width: 42, height: 42, borderRadius: "50%", background: "linear-gradient(135deg,#2A3EFF,#33D3A3)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 800 }}>{(a.name || "A")[0]}</div>
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
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 13, color: "var(--fu-text-secondary)" }}>{orders.length} total orders</div>
              <button onClick={exportCSV} style={{ display: "flex", alignItems: "center", gap: 6, background: "var(--fu-cta-bg)", border: "none", borderRadius: 12, padding: "9px 14px", color: "var(--fu-cta-text)", fontWeight: 700, fontSize: 12.5, cursor: "pointer" }}>
                <Download size={14} /> Export for Well Fed
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {orders.map(o => (
                <div key={o.id} style={{ background: "var(--fu-card)", borderRadius: 16, padding: 14, boxShadow: "0 2px 12px rgba(0,0,0,0.3)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5, color: "var(--fu-text)" }}>{o.athlete_name || "Athlete"} · Week of {o.week_of}</div>
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
      </div>

      {editing && (
        <MealEditor meal={editing === "new" ? null : editing} onCancel={() => setEditing(null)} onSaved={handleSaved} />
      )}
    </div>
  );
}
