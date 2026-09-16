"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Membre } from "@/lib/types";

type RegionOption = {
  id: string;
  nom: string;
};

type SousRegionOption = {
  id: string;
  nom: string;
  region_id: string;
};

type ParoisseOption = {
  id: string;
  nom: string;
  sous_region_id: string;
};

export default function InscriptionForm({
  regions,
  sousRegions,
  paroisses,
}: {
  regions: RegionOption[];
  sousRegions: SousRegionOption[];
  paroisses: ParoisseOption[];
}) {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<"formulaire" | "doublons" | "envoi">("formulaire");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [duplicates, setDuplicates] = useState<Pick<Membre, "id" | "nom" | "prenoms" | "contact">[]>([]);

  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    nom: "",
    prenoms: "",
    statut: "moniteur" as "moniteur" | "assistant",
    poste: "",
    contact: "",
    regionId: "",
    sousRegionId: "",
    paroisseId: "",
    charteAcceptee: false,
    reglementAccepte: false,
  });

  const sousRegionsFiltrees = useMemo(
    () => sousRegions.filter((sr) => sr.region_id === form.regionId),
    [sousRegions, form.regionId]
  );

  const paroissesFiltrees = useMemo(
    () => paroisses.filter((p) => p.sous_region_id === form.sousRegionId),
    [paroisses, form.sousRegionId]
  );

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function checkDuplicatesThenSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (form.password !== form.confirmPassword) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    if (!form.charteAcceptee || !form.reglementAccepte) {
      setError("Merci d'accepter la charte et le règlement intérieur pour continuer.");
      return;
    }

    setLoading(true);
    const { data, error: rpcError } = await supabase.rpc("find_duplicate_membres", {
      p_nom: form.nom,
      p_contact: form.contact,
    });
    setLoading(false);

    if (rpcError) {
      await submit();
      return;
    }

    if (data && data.length > 0) {
      setDuplicates(data);
      setStep("doublons");
      return;
    }

    await submit();
  }

  async function submit() {
    setLoading(true);
    setError(null);

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
    });

    if (signUpError || !signUpData.user) {
      setLoading(false);
      setError(signUpError?.message ?? "Impossible de créer le compte.");
      return;
    }

    const { error: insertError } = await supabase.from("membres").insert({
      user_id: signUpData.user.id,
      nom: form.nom,
      prenoms: form.prenoms,
      statut: form.statut,
      poste: form.poste || null,
      contact: form.contact,
      sous_region_id: form.sousRegionId,
      paroisse_id: form.paroisseId || null,
      role: "membre",
      statut_validation: "en_attente",
      charte_acceptee: form.charteAcceptee,
      reglement_interieur_accepte: form.reglementAccepte,
    });

    setLoading(false);

    if (insertError) {
      setError("Compte créé, mais l'enregistrement de la fiche a échoué : " + insertError.message);
      return;
    }

    setStep("envoi");
  }

  if (step === "envoi") {
    return (
      <div className="rounded border border-line bg-white p-6">
        <h2 className="font-display text-xl text-navy font-semibold mb-2">
          Inscription envoyée
        </h2>
        <p className="text-ink/70">
          Votre fiche est en attente de validation par un administrateur de
          votre sous-région. Vous recevrez une notification dès qu&apos;elle
          sera activée.
        </p>
      </div>
    );
  }

  if (step === "doublons") {
    return (
      <div className="rounded border border-line bg-white p-6">
        <h2 className="font-display text-xl text-navy font-semibold mb-2">
          Fiche(s) similaire(s) trouvée(s)
        </h2>
        <p className="text-ink/70 mb-4">
          Le nom ou le contact que vous avez saisis ressemble à une fiche déjà
          enregistrée. Si c&apos;est une erreur de votre part, corrigez vos
          informations. Sinon, vous pouvez confirmer votre inscription.
        </p>
        <ul className="text-sm text-ink/80 mb-6 space-y-1">
          {duplicates.map((d) => (
            <li key={d.id} className="border-b border-line py-1">
              {d.prenoms} {d.nom} — {d.contact}
            </li>
          ))}
        </ul>
        <div className="flex gap-3">
          <button
            onClick={() => setStep("formulaire")}
            className="px-4 py-2 rounded border border-navy/20 text-navy"
          >
            Corriger mes informations
          </button>
          <button
            onClick={submit}
            disabled={loading}
            className="px-4 py-2 rounded bg-navy text-white disabled:opacity-60"
          >
            {loading ? "Envoi…" : "Confirmer quand même"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={checkDuplicatesThenSubmit} className="space-y-5 bg-white border border-line rounded p-6">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Nom">
          <input required value={form.nom} onChange={(e) => update("nom", e.target.value)} className="input" />
        </Field>
        <Field label="Prénoms">
          <input required value={form.prenoms} onChange={(e) => update("prenoms", e.target.value)} className="input" />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Statut">
          <select value={form.statut} onChange={(e) => update("statut", e.target.value as "moniteur" | "assistant")} className="input">
            <option value="moniteur">Moniteur</option>
            <option value="assistant">Assistant</option>
          </select>
        </Field>
        <Field label="Poste (bureau, le cas échéant)">
          <input value={form.poste} onChange={(e) => update("poste", e.target.value)} className="input" placeholder="Président, Vice-Président…" />
        </Field>
      </div>

      <Field label="Téléphone">
        <input
          type="tel"
          required
          value={form.contact}
          onChange={(e) => update("contact", e.target.value)}
          className="input"
          placeholder="Ex. 0195648246"
        />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Région">
          <select
            required
            value={form.regionId}
            onChange={(e) => {
              update("regionId", e.target.value);
              update("sousRegionId", "");
              update("paroisseId", "");
            }}
            className="input"
          >
            <option value="" disabled>Sélectionner…</option>
            {regions.map((r) => (
              <option key={r.id} value={r.id}>{r.nom}</option>
            ))}
          </select>
        </Field>
        <Field label="Sous-région">
          <select
            required
            value={form.sousRegionId}
            onChange={(e) => {
              update("sousRegionId", e.target.value);
              update("paroisseId", "");
            }}
            className="input"
            disabled={!form.regionId}
          >
            <option value="" disabled>Sélectionner…</option>
            {sousRegionsFiltrees.map((sr) => (
              <option key={sr.id} value={sr.id}>{sr.nom}</option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Paroisse">
        <select
          value={form.paroisseId}
          onChange={(e) => update("paroisseId", e.target.value)}
          className="input"
          disabled={!form.sousRegionId}
        >
          <option value="">Sélectionner…</option>
          {paroissesFiltrees.map((p) => (
            <option key={p.id} value={p.id}>{p.nom}</option>
          ))}
        </select>
      </Field>

      <hr className="border-line" />

      <Field label="Email (identifiant de connexion)">
        <input type="email" required value={form.email} onChange={(e) => update("email", e.target.value)} className="input" />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Mot de passe">
          <input
            type="password"
            required
            minLength={8}
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
            className="input"
          />
        </Field>
        <Field label="Confirmer le mot de passe">
          <input
            type="password"
            required
            minLength={8}
            value={form.confirmPassword}
            onChange={(e) => update("confirmPassword", e.target.value)}
            className="input"
          />
        </Field>
      </div>

      <label className="flex items-start gap-2 text-sm text-ink/80">
        <input type="checkbox" checked={form.charteAcceptee} onChange={(e) => update("charteAcceptee", e.target.checked)} className="mt-1" />
        J&apos;ai lu et j&apos;accepte la charte / le code de bonne conduite.
      </label>
      <label className="flex items-start gap-2 text-sm text-ink/80">
        <input type="checkbox" checked={form.reglementAccepte} onChange={(e) => update("reglementAccepte", e.target.checked)} className="mt-1" />
        J&apos;ai pris connaissance du Règlement Intérieur des Cours Bibliques.
      </label>

      {error && <p className="text-sm text-red-700">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded bg-navy text-white font-medium py-2 hover:bg-navy-light transition-colors disabled:opacity-60"
      >
        {loading ? "Vérification…" : "S'inscrire"}
      </button>

      <style jsx global>{`
        .input {
          width: 100%;
          border-radius: 4px;
          border: 1px solid #e4e0d4;
          padding: 0.5rem 0.75rem;
          background: white;
        }
      `}</style>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-ink mb-1">{label}</label>
      {children}
    </div>
  );
}