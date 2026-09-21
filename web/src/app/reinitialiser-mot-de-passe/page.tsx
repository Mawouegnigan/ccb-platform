"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import PasswordInput from "@/components/PasswordInput";

export default function ReinitialiserMotDePassePage() {
  const router = useRouter();
  const supabase = createClient();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [succes, setSucces] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setError(
        "Impossible de mettre à jour le mot de passe. Le lien a peut-être expiré — refaites une demande depuis « Mot de passe oublié »."
      );
      return;
    }

    setSucces(true);
    setTimeout(() => {
      router.push("/login");
    }, 2000);
  }

  if (succes) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-parchment px-6">
        <div className="w-full max-w-sm text-center">
          <h1 className="font-display text-2xl text-navy font-semibold mb-2">
            Mot de passe mis à jour
          </h1>
          <p className="text-sm text-ink/70">Redirection vers la connexion…</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-parchment px-6">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-2xl text-navy font-semibold mb-1">
          Nouveau mot de passe
        </h1>
        <p className="text-sm text-ink/60 mb-6">
          Choisissez un nouveau mot de passe pour votre compte.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              Nouveau mot de passe
            </label>
            <PasswordInput
              required
              minLength={8}
              value={password}
              onChange={setPassword}
              className="w-full rounded border border-line px-3 py-2 bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1">
              Confirmer le mot de passe
            </label>
            <PasswordInput
              required
              minLength={8}
              value={confirmPassword}
              onChange={setConfirmPassword}
              className="w-full rounded border border-line px-3 py-2 bg-white"
            />
          </div>

          {error && <p className="text-sm text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-navy text-white font-medium py-2 hover:bg-navy-light transition-colors disabled:opacity-60"
          >
            {loading ? "Enregistrement…" : "Enregistrer le nouveau mot de passe"}
          </button>
        </form>
      </div>
    </main>
  );
}