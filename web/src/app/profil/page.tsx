import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";
import ProfilForm from "@/components/ProfilForm";
import type { RoleType, ValidationStatut } from "@/lib/types";

const ROLE_LABELS: Record<RoleType, string> = {
  admin_national: "Administrateur National",
  admin_region: "Administrateur Région",
  admin_sous_region: "Administrateur Sous-Région",
  membre: "Membre",
};

const STATUT_LABEL: Record<ValidationStatut, string> = {
  en_attente: "En attente de validation",
  valide: "Validé",
  rejete: "Rejeté",
};

// Forme attendue du résultat de la requête ci-dessous. Nécessaire car
// Supabase/TypeScript n'infère pas correctement le type sur une jointure
// explicite via FK hint (!membres_sous_region_id_fkey) — sans ce type,
// TS retombe sur 'never' et bloque l'accès aux propriétés (nom, prenoms...).
type MembreProfil = {
  id: string;
  nom: string;
  prenoms: string;
  statut: string;
  poste: string | null;
  contact: string;
  statut_validation: ValidationStatut;
  role: RoleType;
  date_inscription: string;
  photo_url: string | null;
  identifiant: string | null;
  sous_region_id: string;
  paroisse_id: string | null;
  sous_regions: { nom: string } | { nom: string }[] | null;
  paroisses: { nom: string } | { nom: string }[] | null;
};

export default async function ProfilPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Note : jointure explicite sur sous_regions car membres possède deux FK
  // vers cette table (sous_region_id ET admin_sous_region_id) — PostgREST
  // refuse sinon la requête pour ambiguïté (même bug déjà rencontré ailleurs).
  const { data: membreData } = await supabase
    .from("membres")
    .select(
      "id, nom, prenoms, statut, poste, contact, statut_validation, role, date_inscription, photo_url, identifiant, sous_region_id, paroisse_id, sous_regions!membres_sous_region_id_fkey(nom), paroisses(nom)"
    )
    .eq("user_id", user!.id)
    .single();

  const membre = membreData as unknown as MembreProfil | null;

  if (!membre) {
    // Compte auth existant mais sans fiche membre rattachée : cas anormal,
    // on renvoie vers la connexion plutôt que d'afficher une page vide.
    redirect("/login");
  }

  const sousRegionNom = Array.isArray(membre.sous_regions)
    ? membre.sous_regions[0]?.nom
    : membre.sous_regions?.nom;
  const paroisseNom = Array.isArray(membre.paroisses)
    ? membre.paroisses[0]?.nom
    : membre.paroisses?.nom;

  // Bucket privé : on génère une URL signée à courte durée de vie plutôt
  // que de stocker/exposer une URL publique en base.
  let photoSignedUrl: string | null = null;
  if (membre.photo_url) {
    const { data: signedData } = await supabase.storage
      .from("photos-profil")
      .createSignedUrl(membre.photo_url, 60 * 60);
    photoSignedUrl = signedData?.signedUrl ?? null;
  }

  const { data: paroissesData } = await supabase
    .from("paroisses")
    .select("id, nom")
    .eq("sous_region_id", membre.sous_region_id)
    .order("nom");

  return (
    <div className="min-h-screen bg-parchment">
      <header className="bg-navy text-white px-8 py-5 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-gold-light/90">
            Église du Christianisme Céleste
          </p>
          <p className="font-display text-lg font-semibold mt-1">
            Coordination des Cours Bibliques
          </p>
        </div>
        <LogoutButton />
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10">

        <div className="flex flex-wrap gap-4 mb-4">
          <a href="/annonces"
            className="inline-block text-sm text-navy hover:underline font-medium"
          >
            Voir les annonces &amp; actualités →
          </a>
          <a href="/ressources"
            className="inline-block text-sm text-navy hover:underline font-medium"
          >
            Ressources →
          </a>
          <a href="/a-propos"
            className="inline-block text-sm text-navy hover:underline font-medium"
          >
            À propos →
          </a>
        </div>
        <h1 className="font-display text-2xl text-navy font-semibold mb-1">
          Mon profil
        </h1>
        <p className="text-ink/60 mb-1">
          {membre.prenoms} {membre.nom} — {ROLE_LABELS[membre.role as RoleType]}
        </p>
        {membre.identifiant && (
          <p className="font-mono text-sm text-navy/80 mb-3">
            {membre.identifiant}
          </p>
        )}

        {membre.identifiant && membre.statut_validation === "valide" && (

          <a href={`/api/carte-membre/${membre.id}?t=${Date.now()}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block mb-8 text-sm px-3 py-1.5 rounded border border-navy/20 text-navy hover:bg-navy/5 transition-colors"
          >
            Télécharger ma carte de membre (PDF)
          </a>
        )}
        {!(membre.identifiant && membre.statut_validation === "valide") && (
          <div className="mb-8" />
        )}

        <div className="rounded border border-line bg-white p-6 mb-6">
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-ink/50">Statut</dt>
              <dd className="text-ink capitalize">
                {membre.statut}
                {membre.poste ? ` · ${membre.poste}` : ""}
              </dd>
            </div>
            <div>
              <dt className="text-ink/50">Validation</dt>
              <dd className="text-ink">
                {STATUT_LABEL[membre.statut_validation as ValidationStatut]}
              </dd>
            </div>
            <div>
              <dt className="text-ink/50">Sous-région</dt>
              <dd className="text-ink">{sousRegionNom ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-ink/50">Paroisse</dt>
              <dd className="text-ink">{paroisseNom ?? "—"}</dd>
            </div>
          </dl>
        </div>

        <div className="rounded border border-line bg-white p-6">
          <h2 className="font-display text-lg text-navy font-semibold mb-4">
            Modifier mes informations
          </h2>
          <ProfilForm
            membreId={membre.id}
            nom={membre.nom}
            prenoms={membre.prenoms}
            contact={membre.contact}
            poste={membre.poste}
            paroisseId={membre.paroisse_id}
            paroisses={paroissesData ?? []}
            photoSignedUrl={photoSignedUrl}
          />
        </div>
      </main>
    </div>
  );
}