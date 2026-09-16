"use client";

import { useRef, useState, useEffect, useCallback } from "react";

type DocumentContenu = {
  titre: string;
  sousTitre: string;
  preambule: string[];
  articles: { numero: number; texte: string }[];
  signature: string;
};

export default function LectureModal({
  document,
  open,
  onClose,
  onConfirm,
}: {
  document: DocumentContenu;
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [hasReachedEnd, setHasReachedEnd] = useState(false);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const { scrollTop, scrollHeight, clientHeight } = el;
    const scrollable = scrollHeight - clientHeight;
    const pct = scrollable <= 0 ? 100 : Math.min(100, (scrollTop / scrollable) * 100);
    setProgress(pct);

    if (scrollable <= 0 || scrollTop + clientHeight >= scrollHeight - 24) {
      setHasReachedEnd(true);
    }
  }, []);

  // Réinitialise l'état de lecture à chaque nouvelle ouverture, et vérifie
  // immédiatement si le contenu tient déjà entièrement à l'écran (dans ce
  // cas, pas besoin de scroller pour "avoir tout lu").
  useEffect(() => {
    if (open) {
      setProgress(0);
      setHasReachedEnd(false);
      requestAnimationFrame(() => handleScroll());
    }
  }, [open, handleScroll]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-navy/40 backdrop-blur-sm px-4 py-8"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[85vh] bg-white rounded-lg shadow-2xl flex flex-col overflow-hidden"
      >
        {/* En-tête */}
        <div className="px-8 pt-6 pb-4 border-b border-line">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-gold-dark font-medium mb-1">
                {document.sousTitre}
              </p>
              <h2 className="font-display text-xl text-navy font-semibold leading-snug">
                {document.titre}
              </h2>
            </div>
            <button
              onClick={onClose}
              aria-label="Fermer"
              className="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-ink/40 hover:bg-parchment hover:text-ink transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Barre de progression de lecture */}
        <div className="h-1 bg-parchment">
          <div
            className="h-full bg-navy transition-all duration-150"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Corps scrollable */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto px-8 py-6"
        >
          <div className="space-y-4">
            {document.preambule.map((p, i) => (
              <p
                key={i}
                className={`text-[15px] leading-relaxed text-ink/85 ${
                  i === 0
                    ? "first-letter:font-display first-letter:text-5xl first-letter:text-navy first-letter:font-semibold first-letter:mr-2 first-letter:float-left first-letter:leading-[0.85]"
                    : ""
                }`}
              >
                {p}
              </p>
            ))}
          </div>

          <div className="my-8 flex items-center gap-3">
            <div className="h-px flex-1 bg-line" />
            <span className="text-xs uppercase tracking-widest text-gold-dark font-medium">
              Articles
            </span>
            <div className="h-px flex-1 bg-line" />
          </div>

          <div className="space-y-5">
            {document.articles.map((a) => (
              <div key={a.numero} className="flex gap-4">
                <span className="shrink-0 w-8 h-8 rounded-full bg-navy/5 border border-navy/15 text-navy text-xs font-semibold flex items-center justify-center mt-0.5">
                  {a.numero}
                </span>
                <p className="text-[15px] leading-relaxed text-ink/85 pt-1">{a.texte}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 pt-6 border-t border-line">
            <p className="text-sm italic text-ink/60 text-right">{document.signature}</p>
          </div>
        </div>

        {/* Pied — confirmation */}
        <div className="px-8 py-5 border-t border-line bg-parchment/60">
          {!hasReachedEnd ? (
            <p className="text-xs text-ink/50 text-center">
              Faites défiler jusqu&apos;au bas du document pour continuer.
            </p>
          ) : (
            <button
              onClick={onConfirm}
              className="w-full rounded bg-navy text-white font-medium py-2.5 hover:bg-navy-light transition-colors"
            >
              J&apos;ai lu et compris — Accepter
            </button>
          )}
        </div>
      </div>
    </div>
  );
}