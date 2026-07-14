import { createClient } from "@/lib/supabase/server";
import { ProfileView } from "@/components/ProfileView";

export default async function ProfilePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [{ data: profile }, { data: events }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("training_events").select("*").eq("athlete_id", user.id),
  ]);

  return <ProfileView profile={profile} initialEvents={events || []} />;
}
