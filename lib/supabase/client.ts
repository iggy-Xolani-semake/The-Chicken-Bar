import { createClient } from "@supabase/supabase-js";

// Public/browser Supabase client — uses the anon/publishable key only.
// This key is SAFE to expose in frontend code by design (that's what
// "publishable" means) because every table it touches is protected by
// Row Level Security policies defined in the schema files. This client
// can never bypass RLS — it authenticates as whatever role the current
// session has (anonymous visitor or logged-in admin), and Postgres
// enforces the actual access rules server-side regardless of what this
// client tries to do.
//
// NEVER put the service_role key here or anywhere in frontend code — that
// key bypasses RLS entirely and must only ever live in server-side
// contexts (Edge Functions, server actions), set via environment
// variables in the Supabase/Netlify dashboard, never in a file that
// ships to the browser.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables. Add NEXT_PUBLIC_SUPABASE_URL and " +
    "NEXT_PUBLIC_SUPABASE_ANON_KEY to .env.local (see .env.local.example)."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
