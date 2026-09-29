import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { weekOfLabel } from "@/lib/format";
import { applyOptionsToMeal, optionsLabel } from "@/lib/mealOptions";
import { isOrderingOpenFor, closureFor, civilDateStr, MENUS, mealIsOnMenu } from "@/lib/orderWindow";

export async function POST(request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in." }, { status: 401 });
  }

  const { menuKey, items, bogoCode, discountCode } = await request.json();
  if (!MENUS[menuKey]) {
    return NextResponse.json({ error: "Unknown menu." }, { status: 400 });
  }

  const { data: closures } = await supabase.from("menu_closures").select("*");
  const closure = closureFor(menuKey, new Date(), closures || []);
  if (closure) {
    return NextResponse.json({ error: closure.note || `${MENUS[menuKey].label} is closed this week.` }, { status: 400 });
  }

  if (!isOrderingOpenFor(menuKey)) {
    return NextResponse.json({ error: `${MENUS[menuKey].label} ordering is closed right now.` }, { status: 400 });
  }

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "Choose at least 1 meal." }, { status: 400 });
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
  if (meals.some((m) => !mealIsOnMenu(m, menuKey))) {
    return NextResponse.json({ error: "One or more meals don't belong to this menu." }, { status: 400 });
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

  // BOGO codes are validated and applied here, entirely outside Stripe —
  // exactly one line item (the cheapest) is zeroed out, regardless of how
  // many meals are in the cart, and the code is kept in its own table so
  // it can never be typed into Stripe's own promo-code field instead.
  const codeTrimmed = (bogoCode || "").trim().toUpperCase();
  let bogoApplied = false;
  if (codeTrimmed) {
    const { data: bogo } = await supabase.from("bogo_codes").select("*").eq("code", codeTrimmed).single();
    if (!bogo || !bogo.active) {
      return NextResponse.json({ error: "That code isn't valid." }, { status: 400 });
    }
    if (bogo.expires_at && bogo.expires_at < civilDateStr()) {
      return NextResponse.json({ error: "That code has expired." }, { status: 400 });
    }
    if (bogo.max_redemptions && bogo.times_redeemed >= bogo.max_redemptions) {
      return NextResponse.json({ error: "That code has already been fully used." }, { status: 400 });
    }
    if (lines.length < 2) {
      return NextResponse.json({ error: "Add at least 2 meals to use a BOGO code." }, { status: 400 });
    }
    let cheapestIdx = 0;
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].totals.price < lines[cheapestIdx].totals.price) cheapestIdx = i;
    }
    lines[cheapestIdx] = {
      ...lines[cheapestIdx],
      totals: { ...lines[cheapestIdx].totals, price: 0 },
    };
    bogoApplied = true;
  }

  // Percent/dollar-off discount codes are looked up and validated here
  // too (rather than left to Stripe's own hosted promo-code field) so a
  // "max uses" cap can be enforced per athlete — Stripe's own
  // max_redemptions only caps total uses across every customer combined,
  // with no way to limit how many times one specific customer reuses a
  // code. The discount itself is still applied by Stripe at checkout
  // (via the promotion_code on the session), so Stripe computes/charges
  // the exact discounted amount; the math here just mirrors that for our
  // own stored order total.
  const discountCodeTrimmed = (discountCode || "").trim().toUpperCase();
  let discountPromo = null;
  if (discountCodeTrimmed) {
    const promos = await getStripe().promotionCodes.list({ code: discountCodeTrimmed, active: true, limit: 1, expand: ["data.coupon"] });
    const promo = promos.data[0];
    if (!promo) {
      return NextResponse.json({ error: "That code isn't valid." }, { status: 400 });
    }
    if (promo.expires_at && promo.expires_at * 1000 < Date.now()) {
      return NextResponse.json({ error: "That code has expired." }, { status: 400 });
    }
    const maxPerCustomer = Number(promo.metadata?.max_uses_per_customer || 0);
    if (maxPerCustomer > 0) {
      const { count } = await supabase
        .from("discount_redemptions")
        .select("id", { count: "exact", head: true })
        .eq("code", discountCodeTrimmed)
        .eq("athlete_id", user.id);
      if ((count || 0) >= maxPerCustomer) {
        return NextResponse.json({ error: "You've already used this code the maximum number of times." }, { status: 400 });
      }
    }
    discountPromo = promo;
  }

  const { data: profile } = await supabase.from("profiles").select("name, email").eq("id", user.id).single();

  const subtotal = lines.reduce((sum, l) => sum + l.totals.price, 0);
  let total = subtotal;
  if (discountPromo) {
    const coupon = discountPromo.coupon;
    if (coupon.percent_off) total = subtotal * (1 - coupon.percent_off / 100);
    else if (coupon.amount_off) total = Math.max(0, subtotal - coupon.amount_off / 100);
    total = Math.round(total * 100) / 100;
  }
  const weekOf = weekOfLabel();

  const { data: order, error: orderError } = await supabase.from("orders").insert({
    athlete_id: user.id,
    athlete_name: profile?.name,
    athlete_email: profile?.email,
    week_of: weekOf,
    delivery_day: menuKey,
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

  if (bogoApplied) {
    await supabase.rpc("redeem_bogo_code", { p_code: codeTrimmed });
  }
  if (discountPromo) {
    await supabase.from("discount_redemptions").insert({ code: discountCodeTrimmed, athlete_id: user.id, order_id: order.id });
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
    ...(discountPromo ? { discounts: [{ promotion_code: discountPromo.id }] } : {}),
    metadata: { order_id: order.id, athlete_id: user.id },
    success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/checkout/cancel`,
  });

  await supabase.from("orders").update({ stripe_session_id: session.id }).eq("id", order.id);

  return NextResponse.json({ url: session.url });
}
