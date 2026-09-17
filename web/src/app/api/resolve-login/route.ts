import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Reconnaît un identifiant CCB au format CCB-XXXY-0000 (lettres/chiffres
// après le premier tiret, 4 chiffres finaux) — tout le reste est traité
// comme un email tel quel.
const IDENTIFIANT_REGEX = /^CCB-[A-Z]{3}[A-Z]-\d{4}$/i;

export async function POST(request: Request) {
  const { login } = await request.json();

  if (!login || typeof login !== "string") {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const trimmed = login.trim();

  // Cas email : rien à résoudre, on le renvoie tel quel.
  if (!IDENTIFIANT_REGEX.test(trimmed)) {
    return NextResponse.json({ email: trimmed });
  }

  // Cas identifiant : recherche l'email associé via la clé service role
  // (nécessaire car auth.users n'est pas accessible par la clé publique).
  const admin = createAdminClient();

  const { data: membre, error: membreError } = (await admin
    .from("membres")
    .select("user_id")
    .eq("identifiant", trimmed.toUpperCase())
    .maybeSingle()) as { data: { user_id: string | null } | null; error: unknown };

  // Volontairement pas d'information différenciée sur la nature de l'échec
  // (identifiant inexistant, membre sans user_id, erreur réseau...) — pour
  // éviter toute énumération de comptes, le frontend affichera toujours le
  // même message générique "Email ou mot de passe incorrect".
  if (membreError || !membre?.user_id) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  const { data: userData, error: userError } = await admin.auth.admin.getUserById(
    membre.user_id
  );

  if (userError || !userData.user?.email) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  return NextResponse.json({ email: userData.user.email });
}