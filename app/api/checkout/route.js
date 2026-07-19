import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { weekOfLabel } from "@/lib/format";
import { CART_MAX } from "@/lib/constants";
import { applyOptionsToMeal, optionsLabel } from "@/lib/mealOptions";
import { isOrderingOpen } from "@/lib/orderWindow";

export async function POST(request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  if (!isOrderingOpen()) {
    return NextResponse.json({ error: "Ordering is closed right now — it opens again Sunday." }, { status: 400 });
  }

  const { items } = await request.json();
  if (!Array.isArray(items) || items.length === 0 || items.length > CART_MAX) {
    return NextResponse.json({ error: `Choose 1-${CART_MAX} meals.` }, { status: 400 });
  }

  const mealIds = items.map((it) => it.mealId);

  // Re-fetch prices/details from the DB rather than trusting the client cart payload.
  const { data: meals, error: mealsError } = await supabase
    .from("meals")
    .select("*")
    .in("id", mealIds);

  if (mealsError || !meals || meals.length !== mealIds.length) {
    return NextResponse.json({ error: "One or more meals could not be found." }, { status: 400 });
  }
  const mealById = Object.fromEntries(meals.map((m) => [m.id, m]));

  const allOptionIds = [...new Set(items.flatMap((it) => it.optionIds || []))];
  let optionById = {};
  if (allOptionIds.length > 0) {
    const { data: options, error: optionsError } = await supabase
      .from("meal_options")
      .select("*, meal_option_groups(meal_id)")
      .in("id", allOptionIds);
    if (optionsError || !options || options.length !== allOptionIds.length) {
      return NextResponse.json({ error: "One or more selected options could not be found." }, { status: 400 });
    }
    optionById = Object.fromEntries(options.map((o) => [o.id, o]));
  }

  // Build each line with server-validated options — every option must
  // actually belong to the meal it was selected for.
  const lines = [];
  for (const it of items) {
    const meal = mealById[it.mealId];
    const selectedOptions = (it.optionIds || []).map((id) => optionById[id]);
    if (selectedOptions.some((o) => !o || o.meal_option_groups.meal_id !== meal.id)) {
      return NextResponse.json({ error: "One or more options don't match their meal." }, { status: 400 });
    }
    lines.push({ meal, selectedOptions, totals: applyOptionsToMeal(meal, selectedOptions) });
  }

  const { data: profile } = await supabase.from("profiles").select("name, email").eq("id", user.id).single();

  const total = lines.reduce((sum, l) => sum + l.totals.price, 0);
  const weekOf = weekOfLabel();

  const { data: order, error: orderError } = await supabase.from("orders").insert({
    athlete_id: user.id,
    athlete_name: profile?.name,
    athlete_email: profile?.email,
    week_of: weekOf,
    status: "pending_payment",
    total,
  }).select().single();

  if (orderError) {
    return NextResponse.json({ error: orderError.message }, { status: 500 });
  }

  const orderItems = lines.map(({ meal, selectedOptions, totals }) => ({
    order_id: order.id, meal_id: meal.id, name: meal.name, emoji: meal.emoji, category: meal.category,
    calories: totals.calories, protein: totals.protein, carbs: totals.carbs, fat: totals.fat, price: totals.price,
    selected_options: selectedOptions.map((o) => ({ id: o.id, label: o.label })),
  }));
  const { error: itemsError } = await supabase.from("order_items").insert(orderItems);
  if (itemsError) {
    return NextResponse.json({ error: itemsError.message }, { status: 500 });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || request.nextUrl.origin;

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: profile?.email,
    line_items: lines.map(({ meal, selectedOptions, totals }) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: meal.name,
          description: selectedOptions.length ? `${meal.category} — ${optionsLabel(selectedOptions)}` : meal.category,
        },
        unit_amount: Math.round(totals.price * 100),
      },
      quantity: 1,
    })),
    metadata: { order_id: order.id, athlete_id: user.id },
    success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/checkout/cancel`,
  });

  await supabase.from("orders").update({ stripe_session_id: session.id }).eq("id", order.id);

  return NextResponse.json({ url: session.url });
}
