import { createClient } from "@/lib/supabase/server";

export default async function DashboardOverviewPage() {
  const supabase = await createClient();

  // RLS filtre déjà ces requêtes selon le rôle et le périmètre de l'utilisateur connecté.
  const [{ count: totalActifs }, { count: enAttente }, { count: rejetes }] = await Promise.all([
    supabase.from("membres").select("id", { count: "exact", head: true }).eq("statut_validation", "valide"),
    supabase.from("membres").select("id", { count: "exact", head: true }).eq("statut_validation", "en_attente"),
    supabase.from("membres").select("id", { count: "exact", head: true }).eq("statut_validation", "rejete"),
  ]);

  const stats = [
    { label: "Membres actifs", value: totalActifs ?? 0 },
    { label: "En attente de validation", value: enAttente ?? 0 },
    { label: "Rejetés", value: rejetes ?? 0 },
  ];

  return (
    <div>
      <h1 className="font-display text-2xl text-navy font-semibold mb-1">
        Vue d&apos;ensemble
      </h1>
      <p className="text-ink/60 mb-8">
        Chiffres limités à votre périmètre de gestion.
      </p>

      <div className="grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded border border-line bg-white p-5">
            <p className="text-3xl font-display font-semibold text-navy">{s.value}</p>
            <p className="text-sm text-ink/60 mt-1">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
