// Types alignés sur backend/supabase/migrations/*.sql
// À terme, générer automatiquement via `supabase gen types typescript`.

export type RoleType =
  | "admin_national"
  | "admin_region"
  | "admin_sous_region"
  | "membre";

export type MembreStatut = "moniteur" | "assistant";

export type ValidationStatut = "en_attente" | "valide" | "rejete";

export type DocumentType =
  | "circulaire"
  | "support_formation"
  | "conference_video"
  | "conference_image"
  | "autre";

export interface Region {
  id: string;
  nom: string;
  code: string;
  created_at: string;
}

export interface SousRegion {
  id: string;
  nom: string;
  region_id: string;
  created_at: string;
}

export interface Paroisse {
  id: string;
  nom: string;
  sous_region_id: string;
  created_at: string;
}

export interface Membre {
  id: string;
  user_id: string | null;
  nom: string;
  prenoms: string;
  statut: MembreStatut;
  poste: string | null;
  contact: string;
  paroisse_id: string | null;
  sous_region_id: string | null;
  region_id: string | null;
  photo_url: string | null;
  identifiant: string | null;
  role: RoleType;
  admin_region_id: string | null;
  admin_sous_region_id: string | null;
  statut_validation: ValidationStatut;
  date_inscription: string;
  date_validation: string | null;
  valide_par: string | null;
  charte_acceptee: boolean;
  reglement_interieur_accepte: boolean;
  created_at: string;
  updated_at: string;
}

export interface RoleAttribue {
  id: string;
  membre_id: string;
  role_attribue: RoleType;
  perimetre_type: "region" | "sous_region" | null;
  perimetre_id: string | null;
  attribue_par: string;
  date_attribution: string;
}

export interface CcbDocument {
  id: string;
  titre: string;
  description: string | null;
  fichier_url: string | null;
  type: DocumentType;
  publie_par: string;
  date_publication: string;
  created_at: string;
  updated_at: string;
}

export interface Database {
  public: {
    Tables: {
      regions: { Row: Region; Insert: Partial<Region>; Update: Partial<Region> };
      sous_regions: { Row: SousRegion; Insert: Partial<SousRegion>; Update: Partial<SousRegion> };
      paroisses: { Row: Paroisse; Insert: Partial<Paroisse>; Update: Partial<Paroisse> };
      membres: { Row: Membre; Insert: Partial<Membre>; Update: Partial<Membre> };
      roles_attribues: { Row: RoleAttribue; Insert: Partial<RoleAttribue>; Update: Partial<RoleAttribue> };
      documents: { Row: CcbDocument; Insert: Partial<CcbDocument>; Update: Partial<CcbDocument> };
    };
  };
}