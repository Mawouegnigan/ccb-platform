import { createClient } from "@/lib/supabase/server";
import InscriptionForm from "@/components/InscriptionForm";
import Link from "next/link";

export default async function InscriptionPage() {
  const supabase = await createClient();

  const [{ data: regions }, { data: sousRegions }, { data: paroisses }] = await Promise.all([
    supabase.from("regions").select("id, nom").order("nom"),
    supabase.from("sous_regions").select("id, nom, region_id").order("nom"),
    supabase.from("paroisses").select("id, nom, sous_region_id").order("nom"),
  ]);

  return (
    <main className="min-h-screen bg-parchment px-6 py-12">
      <div className="max-w-xl mx-auto">
        <div className="flex items-start justify-between mb-2">
          <p className="text-sm tracking-wide text-navy/60">
            Coordination des Cours Bibliques
          </p>
          <Link href="/login" className="text-sm text-navy hover:underline">
            Déjà inscrit ? Se connecter
          </Link>
        </div>
        <h1 className="font-display text-3xl text-navy font-semibold mb-1">
          Inscription
        </h1>
        <p className="text-ink/70 mb-8">
          Votre fiche sera examinée par l&apos;administrateur de votre
          sous-région (ou un niveau supérieur) avant d&apos;être activée.
        </p>

        <InscriptionForm
          regions={regions ?? []}
          sousRegions={sousRegions ?? []}
          paroisses={paroisses ?? []}
        />
      </div>
    </main>
  );
}