"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function FeedbackWidget() {
  const pathname = usePathname();
  const supabase = createClient();

  const [connecte, setConnecte] = useState(false);
  const [ouvert, setOuvert] = useState(false);
  const [contenu, setContenu] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [envoye, setEnvoye] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setConnecte(!!data.user);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!connecte) return null;

  async function envoyer() {
    if (!contenu.trim()) return;
    setEnvoi(true);
    setError(null);

    const { error } = await supabase.from("commentaires").insert({
      contenu: contenu.trim(),
      page_url: pathname,
    });

    setEnvoi(false);

    if (error) {
      setError("Une erreur est survenue. Merci de réessayer.");
      return;
    }

    setEnvoye(true);
    setContenu("");
    setTimeout(() => {
      setEnvoye(false);
      setOuvert(false);
    }, 1500);
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {ouvert && (
        <div className="mb-3 w-72 rounded-lg border border-line bg-white shadow-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-navy">Un avis, une remarque ?</p>
            <button
              onClick={() => setOuvert(false)}
              aria-label="Fermer"
              className="text-ink/40 hover:text-ink text-sm"
            >
              ✕
            </button>
          </div>

          {envoye ? (
            <p className="text-sm text-emerald-700 py-2">Merci pour votre retour !</p>
          ) : (
            <>
              <textarea
                value={contenu}
                onChange={(e) => setContenu(e.target.value)}
                rows={4}
                placeholder="Votre commentaire…"
                className="w-full rounded border border-line px-2 py-1.5 bg-white text-sm resize-none"
              />
              {error && <p className="text-xs text-red-700 mt-1">{error}</p>}
              <button
                onClick={envoyer}
                disabled={envoi || !contenu.trim()}
                className="w-full mt-2 rounded bg-navy text-white text-sm py-1.5 disabled:opacity-50"
              >
                {envoi ? "Envoi…" : "Envoyer"}
              </button>
            </>
          )}
        </div>
      )}

      <button
        onClick={() => setOuvert(!ouvert)}
        aria-label="Laisser un commentaire"
        className="w-12 h-12 rounded-full bg-navy text-white shadow-lg flex items-center justify-center text-xl hover:bg-navy-light transition-colors"
      >
        💬
      </button>
    </div>
  );
}