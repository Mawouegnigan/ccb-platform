export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import QRCode from "qrcode";
import { createClient } from "@/lib/supabase/server";
import { buildCarteMembrePdf } from "@/lib/carte-membre-pdf";
import { buildVerifyUrl } from "@/lib/qr-signature";

function oneOf<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? v[0] ?? null : v;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  // La RLS existante filtre déjà cette requête au périmètre autorisé de
  // l'utilisateur connecté — aucune logique d'autorisation à dupliquer ici.
  const { data: membreData, error: membreError } = await supabase
    .from("membres")
    .select(
      "id, nom, prenoms, statut, poste, role, statut_validation, identifiant, photo_url, sous_regions!membres_sous_region_id_fkey(nom), paroisses(nom)"
    )
    .eq("id", id)
    .single();

  if (membreError || !membreData) {
    return NextResponse.json({ error: "not_found_or_forbidden" }, { status: 404 });
  }

  const membre = membreData as unknown as {
    id: string;
    nom: string;
    prenoms: string;
    statut: string;
    poste: string | null;
    role: string;
    statut_validation: string;
    identifiant: string | null;
    photo_url: string | null;
    sous_regions: { nom: string } | { nom: string }[] | null;
    paroisses: { nom: string } | { nom: string }[] | null;
  };

  if (membre.statut_validation !== "valide" || !membre.identifiant) {
    return NextResponse.json({ error: "membre_non_valide" }, { status: 409 });
  }

  const sousRegionNom = oneOf(membre.sous_regions)?.nom ?? "—";
  const paroisseNom = oneOf(membre.paroisses)?.nom ?? null;

  // Photo : mêmes policies RLS Storage que le reste de l'app (soi-même ou
  // admin du périmètre) — on réutilise le même client, pas de contournement.
  let photoBuffer: Buffer | null = null;
  if (membre.photo_url) {
    const { data: photoBlob } = await supabase.storage
      .from("photos-profil")
      .download(membre.photo_url);
    if (photoBlob) {
      photoBuffer = Buffer.from(await photoBlob.arrayBuffer());
    }
  }

  const verifyUrl = buildVerifyUrl(membre.id, membre.statut_validation);
  const qrBuffer = await QRCode.toBuffer(verifyUrl, {
    type: "png",
    margin: 1,
    width: 200,
    color: { dark: "#1B2A4A", light: "#FFFFFF" },
  });

  const pdfBuffer = await buildCarteMembrePdf({
    nom: membre.nom,
    prenoms: membre.prenoms,
    statut: membre.statut,
    poste: membre.poste,
    role: membre.role,
    sousRegionNom,
    paroisseNom,
    identifiant: membre.identifiant,
    photoBuffer,
    qrBuffer,
  });

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="carte-${membre.identifiant}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}