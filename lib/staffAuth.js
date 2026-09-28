import { NextResponse } from "next/server";

// Verifies the current request is from a signed-in staff member. API
// routes (unlike /staff/* pages) aren't covered by the middleware's
// staff-only redirect, so mutating routes need to check this themselves.
// Returns { user } on success, or { errorResponse } to return immediately.
export async function requireStaff(supabase) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { errorResponse: NextResponse.json({ error: "Not signed in." }, { status: 401 }) };
  }
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "staff") {
    return { errorResponse: NextResponse.json({ error: "Staff access required." }, { status: 403 }) };
  }
  return { user };
}
