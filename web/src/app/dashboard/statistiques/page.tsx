import { createClient } from "@/lib/supabase/server";
import { getStatistiques, type RepartitionEntry } from "@/lib/stats";

export default async function StatistiquesPage() {
  const supabase = await createClient();
  const stats = await getStatistiques(supabase);

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-1">
        <div>
          <h1 className="font-display text-2xl text-navy font-semibold mb-1">
            Statistiques
          </h1>
          <p className="text-ink/60">
            Chiffres limités à votre périmètre de gestion — {stats.total} membre
            {stats.total > 1 ? "s" : ""}.
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          <a
            href="/api/export-statistiques/pdf"
            className="text-sm px-3 py-1.5 rounded border border-navy/20 text-navy hover:bg-navy/5 transition-colors"
          >
            Exporter en PDF
          </a>
          <a
            href="/api/export-statistiques/excel"
            className="text-sm px-3 py-1.5 rounded border border-navy/20 text-navy hover:bg-navy/5 transition-colors"
          >
            Exporter en Excel
          </a>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mt-8">
        <Section titre="Par statut de validation" entries={stats.parValidation} />
        <Section titre="Par statut" entries={stats.parStatut} />
        <Section titre="Par région" entries={stats.parRegion} />
        <Section titre="Par sous-région" entries={stats.parSousRegion} />
      </div>

      <div className="mt-6">
        <Section
          titre="Évolution des inscriptions (12 derniers mois)"
          entries={stats.evolution.map((e) => ({ label: e.mois, count: e.count }))}
        />
      </div>
    </div>
  );
}

function Section({ titre, entries }: { titre: string; entries: RepartitionEntry[] }) {
  const max = Math.max(1, ...entries.map((e) => e.count));

  return (
    <div className="rounded border border-line bg-white p-5">
      <h2 className="font-display text-base text-navy font-semibold mb-4">{titre}</h2>
      {entries.length === 0 ? (
        <p className="text-sm text-ink/50">Aucune donnée.</p>
      ) : (
        <ul className="space-y-2.5">
          {entries.map((e) => (
            <li key={e.label}>
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-ink/80">{e.label}</span>
                <span className="text-ink/60 font-medium">{e.count}</span>
              </div>
              <div className="h-2 rounded bg-parchment overflow-hidden">
                <div
                  className="h-full bg-gold-dark rounded"
                  style={{ width: `${Math.max((e.count / max) * 100, 3)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}