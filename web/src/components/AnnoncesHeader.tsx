"use client";

import { useState } from "react";
import LogoutButton from "@/components/LogoutButton";

export default function AnnoncesHeader({
  retourHref,
  retourLabel,
}: {
  retourHref: string;
  retourLabel: string;
}) {
  const [menuOuvert, setMenuOuvert] = useState(false);

  return (
    <header className="bg-navy text-white px-6 md:px-8 py-4 md:py-5 relative">
      <div className="flex items-center justify-between">
        <div>
          
          <a  href={retourHref}
            className="hidden md:inline-block text-xs text-white/70 hover:text-white hover:underline mb-2"
          >
            ← {retourLabel}
          </a>
          <p className="text-xs uppercase tracking-wide text-gold-light/90">
            Église du Christianisme Céleste
          </p>
          <p className="font-display text-lg font-semibold mt-1">
            Annonces &amp; Actualités
          </p>
        </div>

        <div className="hidden md:block">
          <LogoutButton />
        </div>

        <button
          onClick={() => setMenuOuvert(!menuOuvert)}
          aria-label="Ouvrir le menu"
          className="md:hidden p-2"
        >
          <span className="block w-6 h-0.5 bg-white mb-1.5" />
          <span className="block w-6 h-0.5 bg-white mb-1.5" />
          <span className="block w-6 h-0.5 bg-white" />
        </button>
      </div>

      {menuOuvert && (
        <div className="md:hidden mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
          
          <a  href={retourHref}
            className="text-sm text-white/80 hover:text-white hover:underline"
          >
            ← {retourLabel}
          </a>
          <LogoutButton />
        </div>
      )}
    </header>
  );
}