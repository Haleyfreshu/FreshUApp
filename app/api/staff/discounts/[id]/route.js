import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStripe } from "@/lib/stripe";
import { requireStaff } from "@/lib/staffAuth";

export async function PATCH(request, { params }) {
  const supabase = createClient();
  const { errorResponse } = await requireStaff(supabase);
  if (errorResponse) return errorResponse;

  const { active } = await request.json();
  try {
    const promotionCode = await getStripe().promotionCodes.update(params.id, { active: !!active, expand: ["coupon"] });
    return NextResponse.json({ promotionCode });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
