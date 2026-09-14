"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { RoleType, ValidationStatut } from "@/lib/types";

type MembreRow = {
  id: string;
  nom: string;
  prenoms: string;
  statut: string;
  poste: string | null;
  contact: string;
  statut_validation: ValidationStatut;
  role: RoleType;
  date_inscription: string;
  sous_regions: { nom: string } | { nom: string }[] | null;
  paroisses: { nom: string } | { nom: string }[] | null;
};

type GeoOption = { id: string; nom: string; region_id?: string };

const STATUT_BADGE: Record<ValidationStatut, string> = {
  en_attente: "bg-amber-100 text-amber-800",
  valide: "bg-emerald-100 text-emerald-800",
  rejete: "bg-red-100 text-red-800",
};

const STATUT_LABEL: Record<ValidationStatut, string> = {
  en_attente: "En attente",
  valide: "Validé",
  rejete: "Rejeté",
};

function oneOf<T>(v: T | T[] | null): T | null {
  if (Array.isArray(v)) return v[0] ?? null;
  return v;
}

export default function MembresTable({
  membres,
  currentRole,
  currentMembreId,
  isAdminNational,
  regions,
  sousRegions,
}: {
  membres: MembreRow[];
  currentRole: RoleType;
  currentMembreId: string;
  isAdminNational: boolean;
  regions: GeoOption[];
  sousRegions: GeoOption[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [nominationRowId, setNominationRowId] = useState<string | null>(null);
  const [editRowId, setEditRowId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function setValidation(id: string, statut: ValidationStatut) {
    setPendingId(id);
    setError(null);
    const { error } = await supabase.from("membres").update({ statut_validation: statut }).eq("id", id);
    setPendingId(null);
    if (error) {
      setError(error.message);
      return;
    }
    router.refresh();
  }

  async function nominate(id: string, role: "admin_region" | "admin_sous_region", perimetreId: string) {
    setPendingId(id);
    setError(null);
    const payload =
      role === "admin_region"
        ? { role, admin_region_id: perimetreId, admin_sous_region_id: null }
        : { role, admin_sous_region_id: perimetreId, admin_region_id: null };

    const { error } = await supabase.from("membres").update(payload).eq("id", id);
    setPendingId(null);
    if (error) {
      setError(error.message);
      return;
    }
    setNominationRowId(null);
    router.refresh();
  }

  async function updateMembre(
    id: string,
    values: { nom: string; prenoms: string; contact: string; poste: string | null }
  ) {
    setPendingId(id);
    setError(null);
    // Note : role et statut_validation ne sont volontairement jamais envoyés ici.
    // Les triggers guard_role_change et guard_validation bloquent de toute façon
    // toute tentative d'auto-promotion ou d'auto-validation côté DB.
    const { error } = await supabase.from("membres").update(values).eq("id", id);
    setPendingId(null);
    if (error) {
      setError(error.message);
      return;
    }
    setEditRowId(null);
    router.refresh();
  }

  async function revokeAdmin(id: string) {
    const confirmed = window.confirm(
      "Retirer les droits d'administration à ce membre ? Il redeviendra un membre simple."
    );
    if (!confirmed) return;

    setPendingId(id);
    setError(null);
    const { error } = await supabase
      .from("membres")
      .update({ role: "membre", admin_region_id: null, admin_sous_region_id: null })
      .eq("id", id);
    setPendingId(null);
    if (error) {
      setError(error.message);
      return;
    }
    router.refresh();
  }

  const peutValiderOuRejeter = currentRole !== "membre";

  if (membres.length === 0) {
    return (
      <p className="text-ink/60 text-sm border border-dashed border-line rounded p-6 text-center">
        Aucune fiche dans votre périmètre pour le moment.
      </p>
    );
  }

  return (
    <div className="border border-line rounded overflow-hidden bg-white">
      {error && <p className="text-sm text-red-700 px-4 py-2 bg-red-50 border-b border-red-100">{error}</p>}
      <table className="w-full text-sm">
        <thead className="bg-navy/5 text-navy text-left">
          <tr>
            <th className="px-4 py-3 font-medium">Nom</th>
            <th className="px-4 py-3 font-medium">Statut</th>
            <th className="px-4 py-3 font-medium">Sous-région</th>
            <th className="px-4 py-3 font-medium">Paroisse</th>
            <th className="px-4 py-3 font-medium">Validation</th>
            <th className="px-4 py-3 font-medium text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {membres.map((m) => {
            const sousRegionNom = oneOf(m.sous_regions)?.nom ?? "—";
            const paroisseNom = oneOf(m.paroisses)?.nom ?? "—";
            const isPending = pendingId === m.id;

            return (
              <Fragment key={m.id}>
                <tr className="border-t border-line">
                  <td className="px-4 py-3">
                    <p className="font-medium text-ink">{m.prenoms} {m.nom}</p>
                    <p className="text-ink/50 text-xs">{m.contact}</p>
                  </td>
                  <td className="px-4 py-3 text-ink/70 capitalize">
                    {m.statut}{m.poste ? ` · ${m.poste}` : ""}
                  </td>
                  <td className="px-4 py-3 text-ink/70">{sousRegionNom}</td>
                  <td className="px-4 py-3 text-ink/70">{paroisseNom}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${STATUT_BADGE[m.statut_validation]}`}>
                      {STATUT_LABEL[m.statut_validation]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                    {m.id === currentMembreId && (
                      <button
                        onClick={() => setEditRowId(editRowId === m.id ? null : m.id)}
                        className="text-navy hover:underline text-xs font-medium"
                      >
                        Modifier
                      </button>
                    )}
                    {peutValiderOuRejeter && m.statut_validation === "en_attente" && (
                      <>
                        <button
                          disabled={isPending}
                          onClick={() => setValidation(m.id, "valide")}
                          className="text-emerald-700 hover:underline text-xs font-medium disabled:opacity-50"
                        >
                          Valider
                        </button>
                        <button
                          disabled={isPending}
                          onClick={() => setValidation(m.id, "rejete")}
                          className="text-red-700 hover:underline text-xs font-medium disabled:opacity-50"
                        >
                          Rejeter
                        </button>
                      </>
                    )}
                    {isAdminNational && m.role === "membre" && (
                      <button
                        onClick={() => setNominationRowId(nominationRowId === m.id ? null : m.id)}
                        className="text-gold-dark hover:underline text-xs font-medium"
                      >
                        Nommer admin
                      </button>
                    )}
                    {m.role !== "membre" && (
                      <span className="text-xs text-navy/70 font-medium">
                        {m.role === "admin_region" ? "Admin. Région" : m.role === "admin_sous_region" ? "Admin. Sous-Région" : "Admin. National"}
                      </span>
                    )}
                    {isAdminNational && (m.role === "admin_region" || m.role === "admin_sous_region") && (
                      <button
                        disabled={isPending}
                        onClick={() => revokeAdmin(m.id)}
                        className="text-red-700 hover:underline text-xs font-medium disabled:opacity-50"
                      >
                        Retirer le pouvoir
                      </button>
                    )}
                  </td>
                </tr>
                {editRowId === m.id && (
                  <tr className="border-t border-line bg-navy/5">
                    <td colSpan={6} className="px-4 py-4">
                      <EditForm
                        membre={m}
                        pending={pendingId === m.id}
                        onSubmit={(values) => updateMembre(m.id, values)}
                        onCancel={() => setEditRowId(null)}
                      />
                    </td>
                  </tr>
                )}
                {nominationRowId === m.id && (
                  <tr className="border-t border-line bg-navy/5">
                    <td colSpan={6} className="px-4 py-4">
                      <NominationForm
                        regions={regions}
                        sousRegions={sousRegions}
                        pending={isPending}
                        onSubmit={(role, perimetreId) => nominate(m.id, role, perimetreId)}
                        onCancel={() => setNominationRowId(null)}
                      />
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function EditForm({
  membre,
  pending,
  onSubmit,
  onCancel,
}: {
  membre: MembreRow;
  pending: boolean;
  onSubmit: (values: { nom: string; prenoms: string; contact: string; poste: string | null }) => void;
  onCancel: () => void;
}) {
  const [nom, setNom] = useState(membre.nom);
  const [prenoms, setPrenoms] = useState(membre.prenoms);
  const [contact, setContact] = useState(membre.contact);
  const [poste, setPoste] = useState(membre.poste ?? "");

  return (
    <div className="flex flex-wrap items-end gap-3">
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
      <button
        disabled={pending || !nom || !prenoms || !contact}
        onClick={() => onSubmit({ nom, prenoms, contact, poste: poste || null })}
        className="px-4 py-1.5 rounded bg-navy text-white text-sm disabled:opacity-50"
      >
        {pending ? "Enregistrement…" : "Enregistrer"}
      </button>
      <button onClick={onCancel} className="px-3 py-1.5 text-sm text-ink/60">
        Annuler
      </button>
    </div>
  );
}

function NominationForm({
  regions,
  sousRegions,
  pending,
  onSubmit,
  onCancel,
}: {
  regions: GeoOption[];
  sousRegions: GeoOption[];
  pending: boolean;
  onSubmit: (role: "admin_region" | "admin_sous_region", perimetreId: string) => void;
  onCancel: () => void;
}) {
  const [role, setRole] = useState<"admin_region" | "admin_sous_region">("admin_sous_region");
  const [perimetreId, setPerimetreId] = useState("");

  const options = role === "admin_region" ? regions : sousRegions;

  return (
    <div className="flex items-end gap-3">
      <div>
        <label className="block text-xs font-medium text-ink/70 mb-1">Rôle attribué</label>
        <select
          value={role}
          onChange={(e) => {
            setRole(e.target.value as "admin_region" | "admin_sous_region");
            setPerimetreId("");
          }}
          className="rounded border border-line px-2 py-1.5 bg-white text-sm"
        >
          <option value="admin_sous_region">Administrateur Sous-Région</option>
          <option value="admin_region">Administrateur Région</option>
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium text-ink/70 mb-1">
          {role === "admin_region" ? "Région" : "Sous-région"}
        </label>
        <select
          value={perimetreId}
          onChange={(e) => setPerimetreId(e.target.value)}
          className="rounded border border-line px-2 py-1.5 bg-white text-sm min-w-[12rem]"
        >
          <option value="" disabled>Sélectionner…</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>{o.nom}</option>
          ))}
        </select>
      </div>
      <button
        disabled={!perimetreId || pending}
        onClick={() => onSubmit(role, perimetreId)}
        className="px-4 py-1.5 rounded bg-navy text-white text-sm disabled:opacity-50"
      >
        {pending ? "Nomination…" : "Confirmer la nomination"}
      </button>
      <button onClick={onCancel} className="px-3 py-1.5 text-sm text-ink/60">
        Annuler
      </button>
    </div>
  );
}