import type { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

type MembreStatsRow = {
  id: string;
  statut: string;
  statut_validation: string;
  date_inscription: string;
  regions: { nom: string } | { nom: string }[] | null;
  sous_regions: { nom: string } | { nom: string }[] | null;
};

function oneOf<T>(v: T | T[] | null): T | null {
  if (Array.isArray(v)) return v[0] ?? null;
  return v;
}

export type RepartitionEntry = { label: string; count: number };

export type EvolutionEntry = { mois: string; count: number };

export type Statistiques = {
  total: number;
  parValidation: RepartitionEntry[];
  parStatut: RepartitionEntry[];
  parRegion: RepartitionEntry[];
  parSousRegion: RepartitionEntry[];
  evolution: EvolutionEntry[];
};

const MOIS_LABELS = [
  "Jan", "Fév", "Mar", "Avr", "Mai", "Jun",
  "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc",
];

function compterPar(rows: MembreStatsRow[], clé: (r: MembreStatsRow) => string): RepartitionEntry[] {
  const compteurs = new Map<string, number>();
  for (const r of rows) {
    const k = clé(r);
    compteurs.set(k, (compteurs.get(k) ?? 0) + 1);
  }
  return [...compteurs.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

const STATUT_LABELS: Record<string, string> = {
  moniteur: "Moniteur",
  assistant: "Assistant",
};

const VALIDATION_LABELS: Record<string, string> = {
  valide: "Validé",
  en_attente: "En attente",
  rejete: "Rejeté",
};

// Calcule toutes les statistiques à partir des membres visibles par
// l'utilisateur courant — RLS filtre déjà selon son rôle et son périmètre
// (national : tout : région : sa région ; sous-région : sa sous-région),
// donc aucune logique de périmètre à dupliquer ici.
export async function getStatistiques(supabase: SupabaseServerClient): Promise<Statistiques> {
  const { data, error } = await supabase
    .from("membres")
    .select(
      "id, statut, statut_validation, date_inscription, regions!membres_region_id_fkey(nom), sous_regions!membres_sous_region_id_fkey(nom)"
    );

  if (error) {
    console.error("Erreur chargement statistiques:", error);
  }

  const rows = (data ?? []) as unknown as MembreStatsRow[];

  const parValidation = compterPar(
    rows,
    (r) => VALIDATION_LABELS[r.statut_validation] ?? r.statut_validation
  );
  const parStatut = compterPar(rows, (r) => STATUT_LABELS[r.statut] ?? r.statut);
  const parRegion = compterPar(rows, (r) => oneOf(r.regions)?.nom ?? "—");
  const parSousRegion = compterPar(rows, (r) => oneOf(r.sous_regions)?.nom ?? "—");

  // Évolution sur les 12 derniers mois (mois courant inclus).
  const maintenant = new Date();
  const moisIndex = new Map<string, number>();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(maintenant.getFullYear(), maintenant.getMonth() - i, 1);
    const clé = `${d.getFullYear()}-${d.getMonth()}`;
    moisIndex.set(clé, 0);
  }
  for (const r of rows) {
    const d = new Date(r.date_inscription);
    const clé = `${d.getFullYear()}-${d.getMonth()}`;
    if (moisIndex.has(clé)) {
      moisIndex.set(clé, (moisIndex.get(clé) ?? 0) + 1);
    }
  }
  const evolution: EvolutionEntry[] = [...moisIndex.entries()].map(([clé, count]) => {
    const [année, mois] = clé.split("-").map(Number);
    return { mois: `${MOIS_LABELS[mois]} ${année}`, count };
  });

  return {
    total: rows.length,
    parValidation,
    parStatut,
    parRegion,
    parSousRegion,
    evolution,
  };
}