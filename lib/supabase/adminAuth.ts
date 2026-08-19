import { supabase } from "./client";

/**
 * Checks if the current session belongs to a real admin (has a row in
 * admin_users). This is a client-side convenience check for UI purposes
 * (show/hide admin nav, redirect if not admin) — it is NOT the actual
 * security boundary. The real security boundary is the RLS policies on
 * every table, which independently check auth.uid() against admin_users
 * on every single write. Even if this check were somehow bypassed, RLS
 * still blocks unauthorized writes at the database level.
 */
export async function getCurrentAdminStatus(): Promise<{
  isAdmin: boolean;
  userId: string | null;
  email: string | null;
}> {
  const { data: sessionData } = await supabase.auth.getSession();
  const user = sessionData.session?.user;

  if (!user) {
    return { isAdmin: false, userId: null, email: null };
  }

  const { data: adminRow } = await supabase
    .from("admin_users")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  return { isAdmin: !!adminRow, userId: user.id, email: user.email ?? null };
}

export async function signInAdmin(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
}

export async function signOutAdmin() {
  await supabase.auth.signOut();
}
