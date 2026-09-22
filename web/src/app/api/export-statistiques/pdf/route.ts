import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getStatistiques } from "@/lib/stats";
import { buildStatistiquesPdf } from "@/lib/statistiques-pdf";

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
  const pdfBuffer = await buildStatistiquesPdf(stats);

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="statistiques-ccb-${new Date().toISOString().slice(0, 10)}.pdf"`,
    },
  });
}