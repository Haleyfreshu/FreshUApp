import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/AppShell";

export default async function AppLayout({ children }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role, onboarded").eq("id", user.id).single();
  if (profile?.role === "staff") redirect("/staff/admin");
  if (!profile?.onboarded) redirect("/onboarding");

  return <AppShell userId={user.id}>{children}</AppShell>;
}
