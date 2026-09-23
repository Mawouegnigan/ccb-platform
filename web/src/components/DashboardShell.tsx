"use client";

import { useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import LogoutButton from "@/components/LogoutButton";
import type { RoleType } from "@/lib/types";

const ROLE_LABELS: Record<RoleType, string> = {
  admin_national: "Administrateur National",
  admin_region: "Administrateur Région",
  admin_sous_region: "Administrateur Sous-Région",
  membre: "Membre",
};

export default function DashboardShell({
  role,
  nom,
  prenoms,
  email,
  children,
}: {
  role: RoleType;
  nom: string | null;
  prenoms: string | null;
  email: string;
  children: React.ReactNode;
}) {
  const [menuOuvert, setMenuOuvert] = useState(false);

  return (
    <div className="min-h-screen flex bg-parchment">
      {/* Barre supérieure mobile uniquement */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 bg-navy text-white flex items-center justify-between px-4 py-3">
        <p className="font-display text-base font-semibold">Coordination des Cours Bibliques</p>
        <button
          onClick={() => setMenuOuvert(!menuOuvert)}
          aria-label="Ouvrir le menu"
          className="p-2"
        >
          <span className="block w-6 h-0.5 bg-white mb-1.5" />
          <span className="block w-6 h-0.5 bg-white mb-1.5" />
          <span className="block w-6 h-0.5 bg-white" />
        </button>
      </div>

      {/* Fond semi-transparent quand le menu mobile est ouvert */}
      {menuOuvert && (
        <div
          className="md:hidden fixed inset-0 bg-black/40 z-30"
          onClick={() => setMenuOuvert(false)}
        />
      )}

      {/* Sidebar : fixe sur desktop, glissante sur mobile */}
      <aside
        className={`w-64 bg-navy text-white flex flex-col shrink-0 fixed md:static top-0 bottom-0 left-0 z-40 transition-transform duration-200 ${
          menuOuvert ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0`}
      >
        <div className="px-6 py-6 border-b border-white/10 hidden md:block">
          <p className="font-display text-lg font-semibold">
            Coordination des Cours Bibliques
          </p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 mt-14 md:mt-0">
          <NavLink href="/dashboard" onClick={() => setMenuOuvert(false)}>
            Vue d&apos;ensemble
          </NavLink>
          <NavLink href="/dashboard/membres" onClick={() => setMenuOuvert(false)}>
            Membres
          </NavLink>
          <NavLink href="/dashboard/statistiques" onClick={() => setMenuOuvert(false)}>
            Statistiques
          </NavLink>
          <NavLink href="/annonces" onClick={() => setMenuOuvert(false)}>
            Annonces &amp; Actualités
          </NavLink>
          <NavLink href="/ressources" onClick={() => setMenuOuvert(false)}>
            Ressources
          </NavLink>
          <NavLink href="/a-propos" onClick={() => setMenuOuvert(false)}>
            À propos
          </NavLink>
          {role === "admin_national" && (
            <NavLink href="/dashboard/commentaires" onClick={() => setMenuOuvert(false)}>
              Commentaires
            </NavLink>
          )}
          <NavLink href="/profil" onClick={() => setMenuOuvert(false)}>
            Mon profil
          </NavLink>
        </nav>

        <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-sm font-medium truncate">
              {nom ? `${prenoms} ${nom}` : email}
            </p>
            <p className="text-xs text-white/60">{ROLE_LABELS[role]}</p>
          </div>
          <LogoutButton />
        </div>
      </aside>

      <main className="flex-1 px-4 md:px-10 py-8 mt-14 md:mt-0 min-w-0">{children}</main>
    </div>
  );
}

function NavLink({
  href,
  children,
  onClick,
}: {
  href: Route;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block px-3 py-2 rounded text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors"
    >
      {children}
    </Link>
  );
}