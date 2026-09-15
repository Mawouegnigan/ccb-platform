"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ProfilForm({
  membreId,
  nom: initialNom,
  prenoms: initialPrenoms,
  contact: initialContact,
  poste: initialPoste,
}: {
  membreId: string;
  nom: string;
  prenoms: string;
  contact: string;
  poste: string | null;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [nom, setNom] = useState(initialNom);
  const [prenoms, setPrenoms] = useState(initialPrenoms);
  const [contact, setContact] = useState(initialContact);
  const [poste, setPoste] = useState(initialPoste ?? "");

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit() {
    setPending(true);
    setError(null);
    setSuccess(false);

    // Note : role et statut_validation ne sont volontairement jamais envoyés ici.
    // Les triggers guard_role_change et guard_validation bloquent de toute façon
    // toute tentative d'auto-promotion ou d'auto-validation côté DB, indépendamment
    // de ce que fait ce formulaire — sécurité en couches, comme dans MembresTable.
    const { error } = await supabase
      .from("membres")
      .update({ nom, prenoms, contact, poste: poste || null })
      .eq("id", membreId);

    setPending(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSuccess(true);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="text-sm text-red-700 px-3 py-2 bg-red-50 border border-red-100 rounded">
          {error}
        </p>
      )}
      {success && (
        <p className="text-sm text-emerald-700 px-3 py-2 bg-emerald-50 border border-emerald-100 rounded">
          Informations mises à jour.
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <div>
          <label className="block text-xs font-medium text-ink/70 mb-1">Prénoms</label>
          <input
            value={prenoms}
            onChange={(e) => setPrenoms(e.target.value)}
            className="rounded border border-line px-2 py-1.5 bg-white text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-ink/70 mb-1">Nom</label>
          <input
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            className="rounded border border-line px-2 py-1.5 bg-white text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-ink/70 mb-1">Contact</label>
          <input
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            className="rounded border border-line px-2 py-1.5 bg-white text-sm"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-ink/70 mb-1">Poste</label>
          <input
            value={poste}
            onChange={(e) => setPoste(e.target.value)}
            className="rounded border border-line px-2 py-1.5 bg-white text-sm"
          />
        </div>
      </div>

      <button
        disabled={pending || !nom || !prenoms || !contact}
        onClick={handleSubmit}
        className="px-4 py-1.5 rounded bg-navy text-white text-sm disabled:opacity-50"
      >
        {pending ? "Enregistrement…" : "Enregistrer"}
      </button>
    </div>
  );
}