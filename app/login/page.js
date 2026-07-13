import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Shell } from "@/components/Shell";
import { LoginForm } from "@/components/auth/LoginForm";

export default async function LoginPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase.from("profiles").select("role, onboarded").eq("id", user.id).single();
    if (profile?.role === "staff") redirect("/staff/admin");
    redirect(profile?.onboarded ? "/dashboard" : "/onboarding");
  }

  return (
    <Shell>
      <LoginForm />
    </Shell>
  );
}
