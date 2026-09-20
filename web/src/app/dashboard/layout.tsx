import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardShell from "@/components/DashboardShell";
import type { RoleType } from "@/lib/types";

const ROLES_AUTORISES: RoleType[] = ["admin_national", "admin_region", "admin_sous_region"];

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

  const { data: membre } = (await supabase
    .from("membres")
    .select("nom, prenoms, role")
    .eq("user_id", user!.id)
    .single()) as { data: { nom: string; prenoms: string; role: RoleType } | null };

  const role: RoleType = membre?.role ?? "membre";

  if (!ROLES_AUTORISES.includes(role)) {
    redirect("/profil");
  }

  return (
    <DashboardShell
      role={role}
      nom={membre?.nom ?? null}
      prenoms={membre?.prenoms ?? null}
      email={user!.email ?? ""}
    >
      {children}
    </DashboardShell>
  );
}