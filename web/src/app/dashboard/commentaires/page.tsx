import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CommentairesManager from "@/components/CommentairesManager";

function oneOf<T>(v: T | T[] | null): T | null {
  return Array.isArray(v) ? v[0] ?? null : v;
}

type CommentaireRow = {
  id: string;
  contenu: string;
  page_url: string | null;
  lu: boolean;
  created_at: string;
  membres: { nom: string; prenoms: string } | { nom: string; prenoms: string }[] | null;
};

export type CommentaireDisplay = {
  id: string;
  contenu: string;
  pageUrl: string | null;
  lu: boolean;
  createdAt: string;
  auteurNom: string;
};

export default async function CommentairesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: membreData } = await supabase
    .from("membres")
    .select("role")
    .eq("user_id", user!.id)
    .single();

  const role = (membreData as { role: string } | null)?.role;

  // RLS bloquerait de toute façon la lecture pour un rôle non autorisé,
  // mais on redirige proprement plutôt que de montrer une liste vide.
  if (role !== "admin_national") {
    redirect("/dashboard");
  }

  const { data, error } = (await supabase
    .from("commentaires")
    .select("id, contenu, page_url, lu, created_at, membres(nom, prenoms)")
    .order("created_at", { ascending: false })) as {
    data: CommentaireRow[] | null;
    error: unknown;
  };

  if (error) {
    console.error("Erreur chargement commentaires:", error);
  }

  const commentaires: CommentaireDisplay[] = (data ?? []).map((c) => {
    const auteur = oneOf(c.membres);
    return {
      id: c.id,
      contenu: c.contenu,
      pageUrl: c.page_url,
      lu: c.lu,
      createdAt: c.created_at,
      auteurNom: auteur ? `${auteur.prenoms} ${auteur.nom}` : "—",
    };
  });

  return (
    <div>
      <h1 className="font-display text-2xl text-navy font-semibold mb-1">Commentaires</h1>
      <p className="text-ink/60 mb-8">Avis et remarques laissés par les utilisateurs connectés.</p>
      <CommentairesManager commentaires={commentaires} />
    </div>
  );
}