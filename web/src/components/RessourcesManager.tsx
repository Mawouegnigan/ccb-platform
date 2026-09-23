"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { RessourceDisplay, RessourceType } from "@/app/ressources/page";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 Mo, aligné sur la limite du bucket documents-ccb
const FICHIER_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
};
const PHOTO_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
};
const MAX_PHOTOS = 10;

const TYPE_LABEL: Record<RessourceType, string> = {
  circulaire: "Circulaire",
  support_formation: "Support de formation",
  conference_video: "Conférence (vidéo)",
  conference_image: "Conférence (photos)",
};

const ONGLETS: { label: string; types: RessourceType[] }[] = [
  { label: "Circulaires", types: ["circulaire"] },
  { label: "Supports de formation", types: ["support_formation"] },
  { label: "Conférences", types: ["conference_video", "conference_image"] },
];

export default function RessourcesManager({
  ressources,
  isAdminNational,
  currentMembreId,
}: {
  ressources: RessourceDisplay[];
  isAdminNational: boolean;
  currentMembreId: string;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [ongletActif, setOngletActif] = useState(0);
  const [showCreate, setShowCreate] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const ressourcesFiltrees = useMemo(
    () => ressources.filter((r) => ONGLETS[ongletActif].types.includes(r.type)),
    [ressources, ongletActif]
  );

  async function createRessource(values: {
    type: RessourceType;
    titre: string;
    description: string;
    fichier: File | null;
    lienExterne: string;
    photos: File[];
  }) {
    setPendingId("__create__");
    setError(null);

    const { data: inserted, error: insertError } = await supabase
      .from("documents")
      .insert({
        titre: values.titre,
        description: values.description || null,
        type: values.type,
        publie_par: currentMembreId,
        // Réutilisation de fichier_url pour stocker un lien externe brut
        // quand le type est conference_video (pas de colonne dédiée).
        fichier_url: values.type === "conference_video" ? values.lienExterne : null,
      })
      .select("id")
      .single();

    if (insertError || !inserted) {
      setPendingId(null);
      setError(insertError?.message ?? "Erreur lors de la création.");
      return;
    }

    const documentId = (inserted as { id: string }).id;

    if ((values.type === "circulaire" || values.type === "support_formation") && values.fichier) {
      const ext = FICHIER_TYPES[values.fichier.type];
      const path = `${documentId}/fichier.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("documents-ccb")
        .upload(path, values.fichier, { contentType: values.fichier.type });

      if (uploadError) {
        setPendingId(null);
        setError(uploadError.message);
        return;
      }

      await supabase.from("documents").update({ fichier_url: path }).eq("id", documentId);
    }

    if (values.type === "conference_image" && values.photos.length > 0) {
      for (let i = 0; i < values.photos.length; i++) {
        const photo = values.photos[i];
        const ext = PHOTO_TYPES[photo.type];
        const path = `${documentId}/photos/${crypto.randomUUID()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("documents-ccb")
          .upload(path, photo, { contentType: photo.type });

        if (uploadError) {
          setPendingId(null);
          setError(uploadError.message);
          return;
        }

        await supabase.from("documents_photos").insert({
          document_id: documentId,
          photo_url: path,
          ordre: i,
        });
      }
    }

    setPendingId(null);
    setShowCreate(false);
    router.refresh();
  }

  async function updateRessource(id: string, values: { titre: string; description: string }) {
    setPendingId(id);
    setError(null);

    const { error } = await supabase
      .from("documents")
      .update({ titre: values.titre, description: values.description || null })
      .eq("id", id);

    setPendingId(null);

    if (error) {
      setError(error.message);
      return;
    }

    setEditId(null);
    router.refresh();
  }

  async function deleteRessource(id: string) {
    const confirmed = window.confirm(
      "Supprimer définitivement cette ressource ? Cette action est irréversible."
    );
    if (!confirmed) return;

    setPendingId(id);
    setError(null);

    const { error } = await supabase.from("documents").delete().eq("id", id);

    setPendingId(null);

    if (error) {
      setError(error.message);
      return;
    }

    router.refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl text-navy font-semibold mb-1">Ressources</h1>
          <p className="text-ink/60 text-sm">
            Circulaires, supports de formation et conférences.
          </p>
        </div>
        {isAdminNational && (
          <button
            onClick={() => setShowCreate(!showCreate)}
            className="px-4 py-1.5 rounded bg-navy text-white text-sm shrink-0"
          >
            {showCreate ? "Annuler" : "Nouvelle ressource"}
          </button>
        )}
      </div>

      <div className="flex gap-1 border-b border-line mb-6">
        {ONGLETS.map((o, i) => (
          <button
            key={o.label}
            onClick={() => setOngletActif(i)}
            className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              ongletActif === i
                ? "border-navy text-navy"
                : "border-transparent text-ink/50 hover:text-ink"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      {error && (
        <p className="text-sm text-red-700 px-3 py-2 bg-red-50 border border-red-100 rounded mb-4">
          {error}
        </p>
      )}

      {showCreate && (
        <div className="rounded border border-line bg-white p-5 mb-6">
          <CreateForm pending={pendingId === "__create__"} onSubmit={createRessource} />
        </div>
      )}

      {ressourcesFiltrees.length === 0 ? (
        <p className="text-ink/60 text-sm border border-dashed border-line rounded p-6 text-center">
          Aucune ressource publiée dans cette catégorie pour le moment.
        </p>
      ) : (
        <div className="space-y-4">
          {ressourcesFiltrees.map((r) => (
            <div key={r.id} className="rounded border border-line bg-white p-5">
              {editId === r.id ? (
                <EditForm
                  ressource={r}
                  pending={pendingId === r.id}
                  onSubmit={(values) => updateRessource(r.id, values)}
                  onCancel={() => setEditId(null)}
                />
              ) : (
                <>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="inline-block px-2 py-0.5 rounded text-xs font-medium bg-navy/10 text-navy mb-2">
                        {TYPE_LABEL[r.type]}
                      </span>
                      <h2 className="font-display text-lg text-navy font-semibold">{r.titre}</h2>
                      <p className="text-xs text-ink/50 mt-1">
                        {new Date(r.date_publication).toLocaleDateString("fr-FR", {
                          dateStyle: "long",
                        })}
                        {r.auteurNom ? ` · ${r.auteurNom}` : ""}
                      </p>
                    </div>
                    {isAdminNational && (
                      <div className="flex gap-3 shrink-0 whitespace-nowrap">
                        <button
                          onClick={() => setEditId(r.id)}
                          className="text-navy hover:underline text-xs font-medium"
                        >
                          Modifier
                        </button>
                        <button
                          disabled={pendingId === r.id}
                          onClick={() => deleteRessource(r.id)}
                          className="text-red-700 hover:underline text-xs font-medium disabled:opacity-50"
                        >
                          Supprimer
                        </button>
                      </div>
                    )}
                  </div>

                  {r.description && (
                    <p className="text-sm text-ink/80 mt-3 whitespace-pre-wrap">{r.description}</p>
                  )}

                  {r.fichierSignedUrl && (
                    <a
                      href={r.fichierSignedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-3 text-sm text-navy hover:underline font-medium"
                    >
                      Voir le fichier joint
                    </a>
                  )}

                  {r.lienExterne && (
                    <a
                      href={r.lienExterne}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-3 text-sm text-navy hover:underline font-medium"
                    >
                      Voir la vidéo →
                    </a>
                  )}

                  {r.photos.length > 0 && (
                    <div className="grid grid-cols-3 gap-2 mt-4">
                      {r.photos.map((p) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={p.id}
                          src={p.url}
                          alt=""
                          className="w-full h-28 object-cover rounded border border-line"
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CreateForm({
  pending,
  onSubmit,
}: {
  pending: boolean;
  onSubmit: (values: {
    type: RessourceType;
    titre: string;
    description: string;
    fichier: File | null;
    lienExterne: string;
    photos: File[];
  }) => void;
}) {
  const [type, setType] = useState<RessourceType>("circulaire");
  const [titre, setTitre] = useState("");
  const [description, setDescription] = useState("");
  const [fichier, setFichier] = useState<File | null>(null);
  const [lienExterne, setLienExterne] = useState("");
  const [photos, setPhotos] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);

  function resetMedia() {
    setFichier(null);
    setLienExterne("");
    setPhotos([]);
    setFileError(null);
  }

  function handleFichierChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileError(null);

    if (!FICHIER_TYPES[file.type]) {
      setFileError("Format non supporté. Utilisez PDF, JPEG ou PNG.");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      setFileError("Fichier trop lourd (10 Mo maximum).");
      e.target.value = "";
      return;
    }
    setFichier(file);
  }

  function handlePhotosChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    setFileError(null);

    if (files.length > MAX_PHOTOS) {
      setFileError(`Maximum ${MAX_PHOTOS} photos par conférence.`);
      e.target.value = "";
      return;
    }
    for (const file of files) {
      if (!PHOTO_TYPES[file.type]) {
        setFileError("Format non supporté. Utilisez JPEG ou PNG.");
        e.target.value = "";
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setFileError("Une photo dépasse 10 Mo.");
        e.target.value = "";
        return;
      }
    }
    setPhotos(files);
  }

  const lienValide = type !== "conference_video" || /^https?:\/\/.+/i.test(lienExterne.trim());

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <div>
          <label className="block text-xs font-medium text-ink/70 mb-1">Type</label>
          <select
            value={type}
            onChange={(e) => {
              setType(e.target.value as RessourceType);
              resetMedia();
            }}
            className="rounded border border-line px-2 py-1.5 bg-white text-sm"
          >
            <option value="circulaire">Circulaire</option>
            <option value="support_formation">Support de formation</option>
            <option value="conference_video">Conférence (vidéo)</option>
            <option value="conference_image">Conférence (photos)</option>
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-xs font-medium text-ink/70 mb-1">Titre</label>
          <input
            value={titre}
            onChange={(e) => setTitre(e.target.value)}
            className="w-full rounded border border-line px-2 py-1.5 bg-white text-sm"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-ink/70 mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded border border-line px-2 py-1.5 bg-white text-sm"
        />
      </div>

      {(type === "circulaire" || type === "support_formation") && (
        <div>
          <label className="inline-block px-3 py-1.5 rounded border border-line bg-white text-sm cursor-pointer hover:bg-parchment">
            {fichier ? fichier.name : "Joindre un fichier"}
            <input
              type="file"
              accept="application/pdf,image/jpeg,image/png"
              onChange={handleFichierChange}
              className="hidden"
            />
          </label>
          <p className="text-xs text-ink/50 mt-1">PDF, JPEG ou PNG — 10 Mo maximum.</p>
        </div>
      )}

      {type === "conference_video" && (
        <div>
          <label className="block text-xs font-medium text-ink/70 mb-1">
            Lien de la vidéo (YouTube, Vimeo…)
          </label>
          <input
            type="url"
            value={lienExterne}
            onChange={(e) => setLienExterne(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            className="w-full rounded border border-line px-2 py-1.5 bg-white text-sm"
          />
        </div>
      )}

      {type === "conference_image" && (
        <div>
          <label className="inline-block px-3 py-1.5 rounded border border-line bg-white text-sm cursor-pointer hover:bg-parchment">
            {photos.length > 0 ? `${photos.length} photo(s) sélectionnée(s)` : "Ajouter des photos"}
            <input
              type="file"
              accept="image/jpeg,image/png"
              multiple
              onChange={handlePhotosChange}
              className="hidden"
            />
          </label>
          <p className="text-xs text-ink/50 mt-1">JPEG ou PNG — 10 photos maximum, 10 Mo chacune.</p>
        </div>
      )}

      {fileError && <p className="text-xs text-red-700">{fileError}</p>}

      <button
        disabled={pending || !titre || !lienValide}
        onClick={() => onSubmit({ type, titre, description, fichier, lienExterne: lienExterne.trim(), photos })}
        className="px-4 py-1.5 rounded bg-navy text-white text-sm disabled:opacity-50"
      >
        {pending ? "Publication…" : "Publier"}
      </button>
    </div>
  );
}

function EditForm({
  ressource,
  pending,
  onSubmit,
  onCancel,
}: {
  ressource: RessourceDisplay;
  pending: boolean;
  onSubmit: (values: { titre: string; description: string }) => void;
  onCancel: () => void;
}) {
  const [titre, setTitre] = useState(ressource.titre);
  const [description, setDescription] = useState(ressource.description ?? "");

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-ink/70 mb-1">Titre</label>
        <input
          value={titre}
          onChange={(e) => setTitre(e.target.value)}
          className="w-full rounded border border-line px-2 py-1.5 bg-white text-sm"
        />
      </div>
      <div>
        <label className="block text-xs font-medium text-ink/70 mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded border border-line px-2 py-1.5 bg-white text-sm"
        />
      </div>
      <div className="flex gap-3">
        <button
          disabled={pending || !titre}
          onClick={() => onSubmit({ titre, description })}
          className="px-4 py-1.5 rounded bg-navy text-white text-sm disabled:opacity-50"
        >
          {pending ? "Enregistrement…" : "Enregistrer"}
        </button>
        <button onClick={onCancel} className="px-3 py-1.5 text-sm text-ink/60">
          Annuler
        </button>
      </div>
    </div>
  );
}