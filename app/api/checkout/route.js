import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { weekOfLabel } from "@/lib/format";
import { CART_MAX } from "@/lib/constants";

export async function POST(request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { mealIds } = await request.json();
  if (!Array.isArray(mealIds) || mealIds.length === 0 || mealIds.length > CART_MAX) {
    return NextResponse.json({ error: `Choose 1-${CART_MAX} meals.` }, { status: 400 });
  }

  // Re-fetch prices/details from the DB rather than trusting the client cart payload.
  const { data: meals, error: mealsError } = await supabase
    .from("meals")
    .select("*")
    .in("id", mealIds);

  if (mealsError || !meals || meals.length !== mealIds.length) {
    return NextResponse.json({ error: "One or more meals could not be found." }, { status: 400 });
  }

  const { data: profile } = await supabase.from("profiles").select("name, email").eq("id", user.id).single();

  const total = meals.reduce((sum, m) => sum + Number(m.price), 0);
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

  const orderItems = meals.map((m) => ({
    order_id: order.id, meal_id: m.id, name: m.name, emoji: m.emoji, category: m.category,
    calories: m.calories, protein: m.protein, carbs: m.carbs, fat: m.fat, price: m.price,
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
    line_items: meals.map((m) => ({
      price_data: {
        currency: "usd",
        product_data: { name: m.name, description: m.category },
        unit_amount: Math.round(Number(m.price) * 100),
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
