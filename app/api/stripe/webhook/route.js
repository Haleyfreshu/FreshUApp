import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  let event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return NextResponse.json({ error: `Webhook signature verification failed: ${err.message}` }, { status: 400 });
  }

  const supabase = createAdminClient();

  // A successful update query doesn't mean a row was actually found — an
  // .eq() that matches nothing still "succeeds" with zero rows changed,
  // and Stripe would still see this as 200 OK. Logging the miss is the
  // only way to tell the two apart after the fact (in Vercel's function
  // logs), since Stripe's own webhook log only shows our HTTP status.
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const { data, error } = await supabase
      .from("orders")
      .update({ status: "This Week", stripe_payment_status: session.payment_status })
      .eq("stripe_session_id", session.id)
      .select("id");
    if (error) {
      console.error(`checkout.session.completed: update failed for session ${session.id}:`, error.message);
    } else if (!data || data.length === 0) {
      console.error(`checkout.session.completed: no order found with stripe_session_id=${session.id}`);
    }
  }

  if (event.type === "checkout.session.expired") {
    const session = event.data.object;
    const { data, error } = await supabase
      .from("orders")
      .update({ status: "Canceled" })
      .eq("stripe_session_id", session.id)
      .select("id");
    if (error) {
      console.error(`checkout.session.expired: update failed for session ${session.id}:`, error.message);
    } else if (!data || data.length === 0) {
      console.error(`checkout.session.expired: no order found with stripe_session_id=${session.id}`);
    }
  }

  return NextResponse.json({ received: true });
}
