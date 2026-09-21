"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import PasswordInput from "@/components/PasswordInput";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    searchParams.get("erreur") === "lien_invalide"
      ? "Ce lien de réinitialisation est invalide ou a expiré. Merci de refaire une demande."
      : null
  );
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Résout l'identifiant CCB en email si besoin ; un email est renvoyé
    // tel quel par la route. En cas d'échec de résolution, on tente quand
    // même signInWithPassword avec la saisie brute plutôt que de révéler
    // que la résolution a échoué — le message d'erreur final reste
    // générique dans tous les cas.
    let resolvedEmail = login.trim();
    try {
      const res = await fetch("/api/resolve-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login: resolvedEmail }),
      });
      if (res.ok) {
        const data = await res.json();
        resolvedEmail = data.email;
      }
    } catch {
      // Échec réseau sur la résolution : on continue avec la saisie brute.
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: resolvedEmail,
      password,
    });

    setLoading(false);

    if (error) {
      setError("Email/identifiant ou mot de passe incorrect.");
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-parchment px-6">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-2xl text-navy font-semibold mb-1">
          Connexion
        </h1>
        <p className="text-sm text-ink/60 mb-6">
          Connectez-vous avec votre email ou votre identifiant CCB.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login" className="block text-sm font-medium text-ink mb-1">
              Email ou Identifiant
            </label>
            <input
              id="login"
              type="text"
              required
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              placeholder="vous@exemple.com ou CCB-LITG-0001"
              className="w-full rounded border border-line px-3 py-2 bg-white"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="password" className="block text-sm font-medium text-ink">
                Mot de passe
              </label>
              <Link href="/mot-de-passe-oublie" className="text-xs text-navy hover:underline">
                Mot de passe oublié ?
              </Link>
            </div>
            <PasswordInput
              required
              value={password}
              onChange={setPassword}
              className="w-full rounded border border-line px-3 py-2 bg-white"
            />
          </div>

          {error && <p className="text-sm text-red-700">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded bg-navy text-white font-medium py-2 hover:bg-navy-light transition-colors disabled:opacity-60"
          >
            {loading ? "Connexion…" : "Se connecter"}
          </button>
        </form>

        <p className="mt-6 text-sm text-ink/60">
          Pas encore de fiche ?{" "}
          <Link href="/inscription" className="text-gold-dark font-medium">
            S&apos;inscrire
          </Link>
        </p>
      </div>
    </main>
  );
}