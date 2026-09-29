import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { requireStaff } from "@/lib/staffAuth";

export async function GET() {
  const supabase = createClient();
  const { errorResponse } = await requireStaff(supabase);
  if (errorResponse) return errorResponse;

  const promos = await getStripe().promotionCodes.list({ limit: 100, expand: ["data.coupon"] });
  return NextResponse.json({ promotionCodes: promos.data });
}

export async function POST(request) {
  const supabase = createClient();
  const { errorResponse } = await requireStaff(supabase);
  if (errorResponse) return errorResponse;

  const { code, type, value, expiresAt, maxRedemptions } = await request.json();

  const codeTrimmed = (code || "").trim().toUpperCase();
  if (!codeTrimmed) {
    return NextResponse.json({ error: "Enter a code." }, { status: 400 });
  }
  const numericValue = Number(value);
  if (!numericValue || numericValue <= 0) {
    return NextResponse.json({ error: "Enter a discount value greater than 0." }, { status: 400 });
  }
  if (type === "percent" && numericValue > 100) {
    return NextResponse.json({ error: "Percent off can't be more than 100." }, { status: 400 });
  }

  try {
    const couponParams = { duration: "once" };
    if (type === "percent") {
      couponParams.percent_off = numericValue;
    } else {
      couponParams.amount_off = Math.round(numericValue * 100);
      couponParams.currency = "usd";
    }
    const coupon = await getStripe().coupons.create(couponParams);

    // maxRedemptions here means "per customer", not Stripe's own
    // max_redemptions (which caps total uses across every customer
    // combined) — so it's stashed in metadata and enforced ourselves in
    // the checkout API instead of being handed to Stripe.
    const promoParams = { coupon: coupon.id, code: codeTrimmed };
    if (expiresAt) {
      promoParams.expires_at = Math.floor(new Date(`${expiresAt}T23:59:59Z`).getTime() / 1000);
    }
    if (maxRedemptions) {
      promoParams.metadata = { max_uses_per_customer: String(Number(maxRedemptions)) };
    }
    const promotionCode = await getStripe().promotionCodes.create(promoParams, { expand: ["coupon"] });

    return NextResponse.json({ promotionCode });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
