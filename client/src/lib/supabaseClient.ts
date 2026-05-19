/* ============================================================
   supabaseClient.ts — Supabase client singleton
   Reads VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from env
   ============================================================ */

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "[Supabase] Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Auth will not work."
  );
}

export const supabase = createClient(supabaseUrl ?? "", supabaseAnonKey ?? "");
