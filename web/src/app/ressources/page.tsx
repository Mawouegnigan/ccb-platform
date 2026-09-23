import { redirect } from "next/navigation";
import AnnoncesHeader from "@/components/AnnoncesHeader";
import DashboardShell from "@/components/DashboardShell";
import { createClient } from "@/lib/supabase/server";
import RessourcesManager from "@/components/RessourcesManager";
import type { RoleType } from "@/lib/types";

function oneOf<T>(v: T | T[] | null): T | null {
  if (Array.isArray(v)) return v[0] ?? null;
  return v;
}

export type RessourceType = "circulaire" | "support_formation" | "conference_video" | "conference_image";

type DocumentQueryRow = {
  id: string;
  titre: string;
  description: string | null;
  fichier_url: string | null;
  type: RessourceType;
  date_publication: string;
  membres: { nom: string; prenoms: string } | { nom: string; prenoms: string }[] | null;
};

type PhotoRow = {
  id: string;
  document_id: string;
  photo_url: string;
  ordre: number;
};

export type PhotoDisplay = { id: string; url: string };

export type RessourceDisplay = {
  id: string;
  titre: string;
  description: string | null;
  type: RessourceType;
  date_publication: string;
  fichierSignedUrl: string | null;
  // Pour type === "conference_video" : fichier_url est réutilisé pour
  // stocker directement un lien externe (YouTube/Vimeo) plutôt qu'un
  // chemin de fichier Storage — pas d'URL signée dans ce cas, juste le
  // lien tel quel.
  lienExterne: string | null;
  photos: PhotoDisplay[];
  auteurNom: string | null;
};

const TYPES_RESSOURCES: RessourceType[] = [
  "circulaire",
  "support_formation",
  "conference_video",
  "conference_image",
];

export default async function RessourcesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: membreData } = await supabase
    .from("membres")
    .select("id, nom, prenoms, role")
    .eq("user_id", user!.id)
    .single();

  const membre = membreData as { id: string; nom: string; prenoms: string; role: RoleType } | null;

  if (!membre) {
    redirect("/login");
  }

  const isAdminNational = membre!.role === "admin_national";
  const isAdmin = membre!.role !== "membre";

  // RLS restreint déjà cette lecture aux utilisateurs authentifiés.
  const { data: documentsData, error: documentsError } = (await supabase
    .from("documents")
    .select(
      "id, titre, description, fichier_url, type, date_publication, membres!documents_publie_par_fkey(nom, prenoms)"
    )
    .in("type", TYPES_RESSOURCES)
    .order("date_publication", { ascending: false })) as {
    data: DocumentQueryRow[] | null;
    error: unknown;
  };

  if (documentsError) {
    console.error("Erreur chargement ressources:", documentsError);
  }

  const documents = documentsData ?? [];
  const conferenceImageIds = documents.filter((d) => d.type === "conference_image").map((d) => d.id);

  let photosRows: PhotoRow[] = [];
  if (conferenceImageIds.length > 0) {
    const { data: photosData } = await supabase
      .from("documents_photos")
      .select("id, document_id, photo_url, ordre")
      .in("document_id", conferenceImageIds)
      .order("ordre");
    photosRows = photosData ?? [];
  }

  const ressourcesDisplay: RessourceDisplay[] = await Promise.all(
    documents.map(async (d) => {
      let fichierSignedUrl: string | null = null;
      let lienExterne: string | null = null;

      if (d.type === "conference_video") {
        lienExterne = d.fichier_url;
      } else if (d.fichier_url) {
        const { data: signedData } = await supabase.storage
          .from("documents-ccb")
          .createSignedUrl(d.fichier_url, 60 * 60);
        fichierSignedUrl = signedData?.signedUrl ?? null;
      }

      const photosForDoc = photosRows.filter((p) => p.document_id === d.id);
      const photos: PhotoDisplay[] = await Promise.all(
        photosForDoc.map(async (p) => {
          const { data: signedData } = await supabase.storage
            .from("documents-ccb")
            .createSignedUrl(p.photo_url, 60 * 60);
          return { id: p.id, url: signedData?.signedUrl ?? "" };
        })
      );

      const auteur = oneOf(d.membres);

      return {
        id: d.id,
        titre: d.titre,
        description: d.description,
        type: d.type,
        date_publication: d.date_publication,
        fichierSignedUrl,
        lienExterne,
        photos,
        auteurNom: auteur ? `${auteur.prenoms} ${auteur.nom}` : null,
      };
    })
  );

  const contenu = (
    <RessourcesManager
      ressources={ressourcesDisplay}
      isAdminNational={isAdminNational}
      currentMembreId={membre!.id}
    />
  );

  if (isAdmin) {
    return (
      <DashboardShell
        role={membre!.role}
        nom={membre!.nom}
        prenoms={membre!.prenoms}
        email={user.email ?? ""}
      >
        <div className="max-w-3xl mx-auto">{contenu}</div>
      </DashboardShell>
    );
  }

  return (
    <div className="min-h-screen bg-parchment">
      <AnnoncesHeader retourHref="/profil" retourLabel="Retour à mon profil" titre="Ressources" />
      <main className="max-w-3xl mx-auto px-6 py-10">{contenu}</main>
    </div>
  );
}