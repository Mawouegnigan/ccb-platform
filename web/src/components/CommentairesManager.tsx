"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { CommentaireDisplay } from "@/app/dashboard/commentaires/page";

export default function CommentairesManager({
  commentaires,
}: {
  commentaires: CommentaireDisplay[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function marquerLu(id: string, lu: boolean) {
    setPendingId(id);
    await supabase.from("commentaires").update({ lu }).eq("id", id);
    setPendingId(null);
    router.refresh();
  }

  async function supprimer(id: string) {
    const confirmed = window.confirm("Supprimer définitivement ce commentaire ?");
    if (!confirmed) return;

    setPendingId(id);
    await supabase.from("commentaires").delete().eq("id", id);
    setPendingId(null);
    router.refresh();
  }

  if (commentaires.length === 0) {
    return (
      <p className="text-ink/60 text-sm border border-dashed border-line rounded p-6 text-center">
        Aucun commentaire reçu pour le moment.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {commentaires.map((c) => (
        <div
          key={c.id}
          className={`rounded border p-4 ${c.lu ? "border-line bg-white" : "border-navy/30 bg-navy/5"}`}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-ink">{c.auteurNom}</p>
              <p className="text-xs text-ink/50">
                {new Date(c.createdAt).toLocaleDateString("fr-FR", { dateStyle: "long" })}
                {" à "}
                {new Date(c.createdAt).toLocaleTimeString("fr-FR", { timeStyle: "short" })}
                {c.pageUrl ? ` · ${c.pageUrl}` : ""}
              </p>
            </div>
            <div className="flex gap-3 shrink-0 whitespace-nowrap">
              <button
                disabled={pendingId === c.id}
                onClick={() => marquerLu(c.id, !c.lu)}
                className="text-navy hover:underline text-xs font-medium disabled:opacity-50"
              >
                {c.lu ? "Marquer non lu" : "Marquer lu"}
              </button>
              <button
                disabled={pendingId === c.id}
                onClick={() => supprimer(c.id)}
                className="text-red-700 hover:underline text-xs font-medium disabled:opacity-50"
              >
                Supprimer
              </button>
            </div>
          </div>
          <p className="text-sm text-ink/80 mt-3 whitespace-pre-wrap">{c.contenu}</p>
        </div>
      ))}
    </div>
  );
}