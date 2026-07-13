import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Shell } from "@/components/Shell";
import { OnboardingForm } from "@/components/OnboardingForm";

export default async function OnboardingPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("onboarded, role").eq("id", user.id).single();
  if (profile?.role === "staff") redirect("/staff/admin");
  if (profile?.onboarded) redirect("/dashboard");

  return (
    <Shell>
      <OnboardingForm userId={user.id} />
    </Shell>
  );
}
