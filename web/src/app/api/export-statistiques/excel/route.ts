import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import { createClient } from "@/lib/supabase/server";
import { getStatistiques, type RepartitionEntry } from "@/lib/stats";

function feuilleRepartition(entries: RepartitionEntry[]) {
  return XLSX.utils.json_to_sheet(
    entries.map((e) => ({ Catégorie: e.label, Nombre: e.count }))
  );
}

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // RLS filtre déjà getStatistiques() au périmètre de l'utilisateur connecté.
  const stats = await getStatistiques(supabase);

  const wb = XLSX.utils.book_new();

  const resume = XLSX.utils.json_to_sheet([
    { Indicateur: "Total de membres (périmètre)", Valeur: stats.total },
  ]);
  XLSX.utils.book_append_sheet(wb, resume, "Résumé");
  XLSX.utils.book_append_sheet(wb, feuilleRepartition(stats.parValidation), "Par validation");
  XLSX.utils.book_append_sheet(wb, feuilleRepartition(stats.parStatut), "Par statut");
  XLSX.utils.book_append_sheet(wb, feuilleRepartition(stats.parRegion), "Par région");
  XLSX.utils.book_append_sheet(wb, feuilleRepartition(stats.parSousRegion), "Par sous-région");
  XLSX.utils.book_append_sheet(
    wb,
    XLSX.utils.json_to_sheet(stats.evolution.map((e) => ({ Mois: e.mois, Inscriptions: e.count }))),
    "Évolution"
  );

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" }) as Buffer;

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="statistiques-ccb-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    },
  });
}