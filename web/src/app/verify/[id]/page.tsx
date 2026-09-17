import { createAdminClient } from "@/lib/supabase/admin";
import { verifyMembreToken } from "@/lib/qr-signature";

function oneOf<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? v[0] ?? null : v;
}

export default async function VerifyPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string }>;
}) {
  const { id } = await params;
  const { token } = await searchParams;

  const admin = createAdminClient();

  const { data: membreData } = await admin
    .from("membres")
    .select(
      "id, nom, prenoms, statut, poste, role, statut_validation, identifiant, sous_regions!membres_sous_region_id_fkey(nom), paroisses(nom)"
    )
    .eq("id", id)
    .maybeSingle();

  const membre = membreData as unknown as {
    id: string;
    nom: string;
    prenoms: string;
    statut: string;
    poste: string | null;
    role: string;
    statut_validation: string;
    identifiant: string | null;
    sous_regions: { nom: string } | { nom: string }[] | null;
    paroisses: { nom: string } | { nom: string }[] | null;
  } | null;

  const valide =
    !!membre &&
    !!token &&
    verifyMembreToken(membre.id, membre.statut_validation, token) &&
    membre.statut_validation === "valide";

  return (
    <main className="min-h-screen flex items-center justify-center bg-parchment px-6">
      <div className="w-full max-w-sm bg-white border border-line rounded-lg overflow-hidden shadow-sm">
        <div className={`px-6 py-4 text-center ${valide ? "bg-emerald-600" : "bg-red-600"}`}>
          <p className="text-white font-semibold text-lg">
            {valide ? "Carte valide" : "Carte invalide"}
          </p>
        </div>

        {valide && membre ? (
          <div className="px-6 py-6 space-y-3">
            <div>
              <p className="text-xs text-ink/50 uppercase tracking-wide">Membre</p>
              <p className="text-ink font-medium">
                {membre.prenoms} {membre.nom}
              </p>
            </div>
            <div>
              <p className="text-xs text-ink/50 uppercase tracking-wide">Identifiant</p>
              <p className="font-mono text-sm text-navy">{membre.identifiant}</p>
            </div>
            <div>
              <p className="text-xs text-ink/50 uppercase tracking-wide">Sous-région</p>
              <p className="text-ink">{oneOf(membre.sous_regions)?.nom ?? "—"}</p>
            </div>
            {oneOf(membre.paroisses)?.nom && (
              <div>
                <p className="text-xs text-ink/50 uppercase tracking-wide">Paroisse</p>
                <p className="text-ink">{oneOf(membre.paroisses)?.nom}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="px-6 py-6">
            <p className="text-sm text-ink/70 text-center">
              Cette carte n&apos;est plus valide, a été révoquée, ou le QR code a été altéré.
            </p>
          </div>
        )}
      </div>
    </main>
  );
}