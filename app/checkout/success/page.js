import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CheckoutSuccessView } from "@/components/CheckoutSuccessView";

export default async function CheckoutSuccessPage({ searchParams }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const sessionId = searchParams?.session_id;
  let order = null;
  if (sessionId) {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("stripe_session_id", sessionId)
      .eq("athlete_id", user.id)
      .single();
    order = data;
  }

  return <CheckoutSuccessView userId={user.id} order={order} />;
}
