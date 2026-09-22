import PDFDocument from "pdfkit";
import type { Statistiques, RepartitionEntry } from "@/lib/stats";

const NAVY = "#1B2A4A";
const GOLD = "#C9A227";
const BAND_HEIGHT = 90;

export async function buildStatistiquesPdf(stats: Statistiques): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 40 });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    dessinerEntete(doc);

    doc
      .fontSize(11)
      .fillColor("#000000")
      .text(`Total de membres dans votre périmètre : ${stats.total}`, 40, doc.y);
    doc.moveDown(1);

    dessinerSection(doc, "Par statut de validation", stats.parValidation);
    dessinerSection(doc, "Par statut (moniteur / assistant)", stats.parStatut);
    dessinerSection(doc, "Par région", stats.parRegion);
    dessinerSection(doc, "Par sous-région", stats.parSousRegion);
    dessinerSection(
      doc,
      "Évolution des inscriptions (12 derniers mois)",
      stats.evolution.map((e) => ({ label: e.mois, count: e.count }))
    );

    doc.end();
  });
}

// Bandeau bleu marine pleine largeur en haut de page, cohérent avec les
// en-têtes utilisés ailleurs dans l'app (DashboardShell, AnnoncesHeader).
// Un bandeau à hauteur fixe évite le rendu bancal d'un titre centré qui
// retombe sur deux lignes de façon imprévisible.
function dessinerEntete(doc: InstanceType<typeof PDFDocument>) {
  const largeur = doc.page.width;
  doc.rect(0, 0, largeur, BAND_HEIGHT).fill(NAVY);

  doc
    .fillColor("#B8C4E0")
    .fontSize(8)
    .text("ÉGLISE DU CHRISTIANISME CÉLESTE", 40, 22, { characterSpacing: 0.5 });

  doc
    .fillColor("#FFFFFF")
    .fontSize(16)
    .text("Statistiques — Coordination des Cours Bibliques", 40, 37, {
      width: largeur - 80,
    });

  doc
    .fillColor("#B8C4E0")
    .fontSize(8)
    .text(`Généré le ${new Date().toLocaleDateString("fr-FR")}`, 40, 68);

  doc.fillColor("#000000");
  doc.y = BAND_HEIGHT + 20;
}

function dessinerSection(
  doc: InstanceType<typeof PDFDocument>,
  titre: string,
  entries: RepartitionEntry[]
) {
  if (doc.y > 660) doc.addPage();

  doc.fontSize(13).fillColor(NAVY).text(titre, 40, doc.y);
  doc.moveDown(0.4);

  if (entries.length === 0) {
    doc.fontSize(9).fillColor("#999999").text("Aucune donnée.", 40, doc.y);
    doc.moveDown(1);
    return;
  }

  const max = Math.max(1, ...entries.map((e) => e.count));
  const barMaxWidth = 220;
  const labelX = 40;
  const barX = 210;

  for (const e of entries) {
    if (doc.y > 730) doc.addPage();
    const y = doc.y;

    doc.fontSize(9).fillColor("#000000").text(e.label, labelX, y, { width: 165 });
    const barWidth = Math.max((e.count / max) * barMaxWidth, 2);
    doc.rect(barX, y + 1, barWidth, 8).fill(GOLD);
    doc.fillColor("#000000").fontSize(9).text(String(e.count), barX + barMaxWidth + 10, y);

    doc.moveDown(0.7);
  }
  doc.moveDown(0.8);
}