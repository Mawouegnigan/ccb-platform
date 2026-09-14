import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import LogoutButton from "@/components/LogoutButton";
import type { RoleType } from "@/lib/types";

const ROLE_LABELS: Record<RoleType, string> = {
  admin_national: "Administrateur National",
  admin_region: "Administrateur Région",
  admin_sous_region: "Administrateur Sous-Région",
  membre: "Membre",
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: membre } = await supabase
    .from("membres")
    .select("nom, prenoms, role")
    .eq("user_id", user!.id)
    .single();

  const role = membre?.role ?? "membre";

  return (
    <div className="min-h-screen flex bg-parchment">
      <aside className="w-64 bg-navy text-white flex flex-col shrink-0">
        <div className="px-6 py-6 border-b border-white/10">
          <p className="text-xs uppercase tracking-wide text-gold-light/90">
            Coordination des Cours Bibliques
          </p>
          <p className="font-display text-lg font-semibold mt-1">CCB Platform</p>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          <NavLink href="/dashboard">Vue d&apos;ensemble</NavLink>
          <NavLink href="/dashboard/membres">Membres</NavLink>
        </nav>

        <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between">
          <div>
            <p className="text-sm font-medium">
              {membre ? `${membre.prenoms} ${membre.nom}` : user!.email}
            </p>
            <p className="text-xs text-white/60">{ROLE_LABELS[role]}</p>
          </div>
          <LogoutButton />
        </div>
      </aside>

      <main className="flex-1 px-10 py-8">{children}</main>
    </div>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="block px-3 py-2 rounded text-sm text-white/80 hover:bg-white/10 hover:text-white transition-colors"
    >
      {children}
    </Link>
  );
}
