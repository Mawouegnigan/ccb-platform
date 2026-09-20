import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import AnnoncesHeader from "@/components/AnnoncesHeader";
import DashboardShell from "@/components/DashboardShell";
import type { RoleType } from "@/lib/types";

export default async function AProposPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: membreData } = await supabase
    .from("membres")
    .select("nom, prenoms, role")
    .eq("user_id", user!.id)
    .single();

  const membre = membreData as { nom: string; prenoms: string; role: RoleType } | null;

  const isAdmin = membre?.role !== "membre" && !!membre;

  const contenu = (
    <>
      <section>
        <h1 className="font-display text-2xl text-navy font-semibold mb-4">
          La Coordination des Cours Bibliques
        </h1>
        <p className="text-ink/80 leading-relaxed">
          [À COMPLÉTER — texte de présentation de la Coordination des Cours
          Bibliques : origine, mission, rattachement à l&apos;Église du
          Christianisme Céleste. Ce paragraphe est un espace réservé à
          remplacer par le texte officiel fourni par la Coordination.]
        </p>
      </section>

      <section className="mt-8">
        <h2 className="font-display text-xl text-navy font-semibold mb-4">
          Historique du bureau
        </h2>
        <div className="rounded border border-line bg-white divide-y divide-line">
          <BureauEntry
            periode="[À COMPLÉTER — ex. 2015 – 2020]"
            nom="[À COMPLÉTER — Nom Prénoms]"
            poste="Président"
          />
          <BureauEntry
            periode="[À COMPLÉTER — ex. 2020 – 2025]"
            nom="[À COMPLÉTER — Nom Prénoms]"
            poste="Président"
          />
          <BureauEntry
            periode="[À COMPLÉTER — ex. 2025 – présent]"
            nom="[À COMPLÉTER — Nom Prénoms]"
            poste="Président"
          />
        </div>
        <p className="text-xs text-ink/50 mt-3">
          Liste indicative à compléter avec la Coordination — ajouter une
          ligne par mandat (période, nom, poste).
        </p>
      </section>
    </>
  );

  if (isAdmin && membre) {
    return (
      <DashboardShell
        role={membre.role}
        nom={membre.nom}
        prenoms={membre.prenoms}
        email={user.email ?? ""}
      >
        <div className="max-w-2xl mx-auto">{contenu}</div>
      </DashboardShell>
    );
  }

  return (
    <div className="min-h-screen bg-parchment">
      <AnnoncesHeader retourHref="/profil" retourLabel="Retour à mon profil" titre="À propos" />
      <main className="max-w-2xl mx-auto px-6 py-10 space-y-8">{contenu}</main>
    </div>
  );
}

function BureauEntry({
  periode,
  nom,
  poste,
}: {
  periode: string;
  nom: string;
  poste: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <div>
        <p className="text-sm font-medium text-ink">{nom}</p>
        <p className="text-xs text-ink/50">{poste}</p>
      </div>
      <p className="text-xs font-mono text-ink/60 shrink-0">{periode}</p>
    </div>
  );
}