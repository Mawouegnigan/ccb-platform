import { createClient } from "@/lib/supabase/server";
import MembresTable from "@/components/MembresTable";

export default async function MembresPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: currentMembre } = await supabase
    .from("membres")
    .select("id, role")
    .eq("user_id", user!.id)
    .single();

  // RLS restreint déjà cette requête au périmètre de l'utilisateur connecté
  // (national : tout ; région : sa région ; sous-région : sa sous-région).
  const { data: membres, error: membresError } = await supabase
    .from("membres")
    .select(
      "id, nom, prenoms, statut, poste, contact, statut_validation, role, date_inscription, sous_regions!membres_sous_region_id_fkey(nom), paroisses(nom)"
    )
    .order("date_inscription", { ascending: false });

  if (membresError) {
    console.error("Erreur chargement membres:", membresError);
  }

  const isAdminNational = currentMembre?.role === "admin_national";

  const [{ data: regions }, { data: sousRegions }] = isAdminNational
    ? await Promise.all([
        supabase.from("regions").select("id, nom").order("nom"),
        supabase.from("sous_regions").select("id, nom, region_id").order("nom"),
      ])
    : [{ data: [] }, { data: [] }];

  return (
    <div>
      <h1 className="font-display text-2xl text-navy font-semibold mb-1">
        Membres
      </h1>
      <p className="text-ink/60 mb-6">
        {isAdminNational
          ? "Registre complet — validation des fiches et nomination des administrateurs."
          : "Fiches de votre périmètre — validation et modification."}
      </p>

      <MembresTable
        membres={membres ?? []}
        currentRole={currentMembre?.role ?? "membre"}
        currentMembreId={currentMembre?.id ?? ""}
        isAdminNational={isAdminNational}
        regions={regions ?? []}
        sousRegions={sousRegions ?? []}
      />
    </div>
  );
}