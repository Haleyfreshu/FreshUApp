"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Trash2, ShoppingBag, Search } from "lucide-react";
import { MealCard } from "@/components/MealCard";
import { useCart } from "@/lib/cartContext";
import { createClient } from "@/lib/supabase/client";
import { CART_MAX } from "@/lib/constants";

export function MenuView({ meals, eatenMealIds }) {
  const router = useRouter();
  const { cart, addToCart, removeFromCart, cartFull } = useCart();
  const [query, setQuery] = useState("");
  const [showCart, setShowCart] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState("");
  const [pending, setPending] = useState(null);

  const filtered = meals.filter(m =>
    m.name.toLowerCase().includes(query.toLowerCase()) || m.category.toLowerCase().includes(query.toLowerCase())
  );
  const grouped = [...new Set(filtered.map(m => m.category))].map(cat => [cat, filtered.filter(m => m.category === cat)]);
  const eatenSet = new Set(eatenMealIds);
  const cartIds = new Set(cart.map(c => c.id));
  const total = cart.reduce((s, m) => s + Number(m.price), 0);

  const handleEat = async (meal) => {
    setPending(meal.id);
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("daily_logs").upsert({
      athlete_id: user.id,
      meal_id: meal.id,
      log_date: new Date().toISOString().slice(0, 10),
      name: meal.name, emoji: meal.emoji,
      calories: meal.calories, protein: meal.protein, carbs: meal.carbs, fat: meal.fat,
    }, { onConflict: "athlete_id,meal_id,log_date" });
    setPending(null);
    router.refresh();
  };

  const handleCheckout = async () => {
    setError("");
    setCheckingOut(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mealIds: cart.map(m => m.id) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Checkout failed.");
      window.location.href = data.url;
    } catch (e) {
      setError(e.message);
      setCheckingOut(false);
    }
  };

  return (
    <div style={{ padding: "18px 20px 20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 22, color: "#0B0E1A" }}>Weekly Menu</div>
        <button onClick={() => setShowCart(true)} style={{
          position: "relative", background: "#0B0E1A", border: "none", borderRadius: 14, padding: "10px 12px", cursor: "pointer",
          display: "flex", alignItems: "center", gap: 6
        }}>
          <ShoppingBag size={16} color="#fff" />
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 12.5 }}>{cart.length}</span>
        </button>
      </div>
      <div style={{ fontSize: 13, color: "#6B7290", marginTop: 4 }}>Choose 1–{CART_MAX} meals for this week. {cart.length}/{CART_MAX} selected.</div>

      <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fff", borderRadius: 14, padding: "10px 14px", marginTop: 14, boxShadow: "0 2px 10px rgba(15,20,50,0.05)" }}>
        <Search size={16} color="#9AA0BF" />
        <input placeholder="Search meals or category" value={query} onChange={e => setQuery(e.target.value)}
          style={{ border: "none", outline: "none", fontSize: 13.5, flex: 1, background: "transparent" }} />
      </div>

      {grouped.map(([cat, items]) => (
        <div key={cat} style={{ marginTop: 20 }}>
          <div style={{ fontWeight: 800, fontSize: 13.5, color: "#4C5378", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 10 }}>{cat}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {items.map(m => (
              <MealCard key={m.id} meal={m}
                onEat={() => handleEat(m)} eaten={eatenSet.has(m.id) || pending === m.id}
                onAdd={addToCart} inCart={cartIds.has(m.id)} cartFull={cartFull} />
            ))}
          </div>
        </div>
      ))}

      {showCart && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", flexDirection: "column", justifyContent: "flex-end", maxWidth: 430, margin: "0 auto" }}>
          <div onClick={() => setShowCart(false)} style={{ position: "absolute", inset: 0, background: "rgba(11,14,26,0.5)" }} />
          <div style={{ position: "relative", background: "#fff", borderRadius: "24px 24px 0 0", padding: "20px 20px 24px", maxHeight: "80vh", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 800, fontSize: 18, color: "#0B0E1A" }}>This week&apos;s cart</div>
              <button onClick={() => setShowCart(false)} style={{ background: "#F3F5FB", border: "none", borderRadius: 10, padding: 6, cursor: "pointer" }}><X size={16} /></button>
            </div>
            <div style={{ overflowY: "auto", flex: 1 }}>
              {cart.length === 0 && <div style={{ color: "#9AA0BF", fontSize: 13.5, textAlign: "center", padding: "30px 0" }}>Your cart is empty. Add up to {CART_MAX} meals.</div>}
              {cart.map(m => (
                <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 0", borderBottom: "1px solid #F3F5FB" }}>
                  <div style={{ width: 40, height: 40, borderRadius: 12, background: `${m.color}1a`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>{m.emoji}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{m.name}</div>
                    <div style={{ fontSize: 11.5, color: "#9AA0BF" }}>${Number(m.price).toFixed(2)}</div>
                  </div>
                  <button onClick={() => removeFromCart(m.id)} style={{ background: "none", border: "none", cursor: "pointer" }}><Trash2 size={16} color="#FF5A5F" /></button>
                </div>
              ))}
            </div>
            {error && <div style={{ color: "#FF5A5F", fontSize: 12.5, marginTop: 8, fontWeight: 600 }}>{error}</div>}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14, marginBottom: 12 }}>
              <span style={{ fontWeight: 700, color: "#6B7290", fontSize: 13.5 }}>Total</span>
              <span style={{ fontWeight: 800, fontSize: 18, color: "#0B0E1A" }}>${total.toFixed(2)}</span>
            </div>
            <button
              disabled={cart.length === 0 || checkingOut}
              onClick={handleCheckout}
              style={{ width: "100%", padding: 15, borderRadius: 14, border: "none", background: cart.length ? "#2A3EFF" : "#E7EBF7", color: cart.length ? "#fff" : "#9AA0BF", fontWeight: 800, fontSize: 15, cursor: cart.length ? "pointer" : "default", opacity: checkingOut ? 0.7 : 1 }}>
              {checkingOut ? "Redirecting to secure checkout…" : "Continue to checkout"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
