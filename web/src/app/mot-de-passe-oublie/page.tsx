"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function MotDePasseOubliePage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [envoye, setEnvoye] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErreur(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/reinitialiser-mot-de-passe`,
    });

    setLoading(false);

    // Supabase ne renvoie jamais d'erreur pour un email simplement inconnu
    // (anti-énumération) — une erreur ici est donc une vraie erreur serveur
    // (rate limit, SMTP en panne...), qu'on peut afficher sans rien révéler.
    if (error) {
      setErreur(
        error.status === 429
          ? "Trop de demandes ont été envoyées récemment. Merci de réessayer dans quelques minutes."
          : "Une erreur est survenue lors de l'envoi. Merci de réessayer dans un instant."
      );
      return;
    }

    setEnvoye(true);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-parchment px-6">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-2xl text-navy font-semibold mb-1">
          Mot de passe oublié
        </h1>

        {envoye ? (
          <>
            <p className="text-sm text-ink/70 mt-4">
              Si un compte correspond à cet email, un lien de réinitialisation
              vient de lui être envoyé. Pensez à vérifier vos spams.
            </p>
            <Link href="/login" className="inline-block mt-6 text-sm text-navy hover:underline font-medium">
              ← Retour à la connexion
            </Link>
          </>
        ) : (
          <>
            <p className="text-sm text-ink/60 mb-6">
              Indiquez l&apos;email associé à votre compte, un lien de
              réinitialisation vous sera envoyé.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-ink mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vous@exemple.com"
                  className="w-full rounded border border-line px-3 py-2 bg-white"
                />
              </div>

              {erreur && <p className="text-sm text-red-700">{erreur}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded bg-navy text-white font-medium py-2 hover:bg-navy-light transition-colors disabled:opacity-60"
              >
                {loading ? "Envoi…" : "Envoyer le lien de réinitialisation"}
              </button>
            </form>

            <Link href="/login" className="inline-block mt-6 text-sm text-navy hover:underline font-medium">
              ← Retour à la connexion
            </Link>
          </>
        )}
      </div>
    </main>
  );
}