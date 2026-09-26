"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const MAX_PHOTO_SIZE = 2 * 1024 * 1024; // 2 Mo, aligné sur la limite du bucket
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export default function ProfilForm({
  membreId,
  nom: initialNom,
  prenoms: initialPrenoms,
  contact: initialContact,
  poste: initialPoste,
  paroisseId: initialParoisseId,
  paroisses,
  photoSignedUrl,
}: {
  membreId: string;
  nom: string;
  prenoms: string;
  contact: string;
  poste: string | null;
  paroisseId: string | null;
  paroisses: { id: string; nom: string }[];
  photoSignedUrl: string | null;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [nom, setNom] = useState(initialNom);
  const [prenoms, setPrenoms] = useState(initialPrenoms);
  const [contact, setContact] = useState(initialContact);
  const [poste, setPoste] = useState(initialPoste ?? "");
  const [paroisseId, setParoisseId] = useState(initialParoisseId ?? "");

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [photoPreview, setPhotoPreview] = useState<string | null>(photoSignedUrl);
  const [photoPending, setPhotoPending] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);

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
      .update({ nom, prenoms, contact, poste: poste || null, paroisse_id: paroisseId || null })
      .eq("id", membreId);

    setPending(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSuccess(true);
    router.refresh();
  }

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoError(null);

    const ext = ALLOWED_TYPES[file.type];
    if (!ext) {
      setPhotoError("Format non supporté. Utilisez JPEG, PNG ou WebP.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_PHOTO_SIZE) {
      setPhotoError("Photo trop lourde (2 Mo maximum).");
      e.target.value = "";
      return;
    }

    setPhotoPending(true);

    // Chemin fixe {membreId}/avatar.{ext} : un upsert écrase l'ancienne
    // photo, pas d'accumulation de fichiers orphelins dans le bucket.
    const path = `${membreId}/avatar.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("photos-profil")
      .upload(path, file, { upsert: true, contentType: file.type });

    if (uploadError) {
      setPhotoPending(false);
      setPhotoError(uploadError.message);
      e.target.value = "";
      return;
    }

    const { error: updateError } = await supabase
      .from("membres")
      .update({ photo_url: path })
      .eq("id", membreId);

    setPhotoPending(false);

    if (updateError) {
      setPhotoError(updateError.message);
      e.target.value = "";
      return;
    }

    // Aperçu immédiat côté client, sans attendre une nouvelle URL signée
    setPhotoPreview(URL.createObjectURL(file));
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-full overflow-hidden border border-line bg-parchment flex items-center justify-center shrink-0">
          {photoPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={photoPreview}
              alt="Photo de profil"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-xs text-ink/40 text-center px-1">Aucune photo</span>
          )}
        </div>
        <div>
          <label className="inline-block px-3 py-1.5 rounded border border-line bg-white text-sm cursor-pointer hover:bg-parchment">
            {photoPending ? "Envoi…" : "Changer la photo"}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoChange}
              disabled={photoPending}
              className="hidden"
            />
          </label>
          <p className="text-xs text-ink/50 mt-1">JPEG, PNG ou WebP — 2 Mo maximum.</p>
          {photoError && <p className="text-xs text-red-700 mt-1">{photoError}</p>}
        </div>
      </div>

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
        <div>
          <label className="block text-xs font-medium text-ink/70 mb-1">Paroisse</label>
          <select
            value={paroisseId}
            onChange={(e) => setParoisseId(e.target.value)}
            className="rounded border border-line px-2 py-1.5 bg-white text-sm"
          >
            <option value="">Sélectionner…</option>
            {paroisses.map((p) => (
              <option key={p.id} value={p.id}>{p.nom}</option>
            ))}
          </select>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={pending}
        className="px-4 py-1.5 rounded bg-navy text-white text-sm disabled:opacity-50"
      >
        {pending ? "Enregistrement…" : "Enregistrer"}
      </button>
    </div>
  );
}