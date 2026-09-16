import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types";

// Ce client utilise la clé service role : il contourne entièrement la RLS.
// À n'utiliser QUE dans du code serveur (Route Handlers, Server Actions),
// jamais dans un composant "use client" — la clé ne doit jamais atteindre
// le navigateur.
export function createAdminClient() {
  return createSupabaseClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}