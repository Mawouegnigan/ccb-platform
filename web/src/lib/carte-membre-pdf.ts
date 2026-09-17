import PDFDocument from "pdfkit";

const COLORS = {
  navy: "#1B2A4A",
  gold: "#B8892B",
  goldLight: "#D4AD5C",
  parchment: "#FAF7F0",
  ink: "#22262F",
  line: "#E4E0D4",
  white: "#FFFFFF",
};

const ROLE_LABELS: Record<string, string> = {
  admin_national: "Administrateur National",
  admin_region: "Administrateur Région",
  admin_sous_region: "Administrateur Sous-Région",
  membre: "",
};

export function buildCarteMembrePdf(opts: {
  nom: string;
  prenoms: string;
  statut: string;
  poste: string | null;
  role: string;
  sousRegionNom: string;
  paroisseNom: string | null;
  identifiant: string;
  photoBuffer: Buffer | null;
  qrBuffer: Buffer;
}): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const W = 153;
    const H = 243;
    const doc = new PDFDocument({ size: [W, H], margin: 0 });

    const chunks: Buffer[] = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // --- En-tête navy ---
    doc.rect(0, 0, W, 32).fill(COLORS.navy);
    doc
      .fillColor(COLORS.goldLight)
      .font("Helvetica")
      .fontSize(5.5)
      .text("ÉGLISE DU CHRISTIANISME CÉLESTE", 6, 8, { width: W - 12, align: "center" });
    doc
      .fillColor(COLORS.white)
      .font("Times-Bold")
      .fontSize(9)
      .text("Coordination des Cours Bibliques", 6, 17, { width: W - 12, align: "center" });

    // --- Bandeau sous-région, gold ---
    doc.rect(0, 32, W, 11).fill(COLORS.gold);
    doc
      .fillColor(COLORS.white)
      .font("Helvetica-Bold")
      .fontSize(6)
      .text(opts.sousRegionNom.toUpperCase(), 6, 35.5, { width: W - 12, align: "center" });

    // --- Cadre photo ---
    const photoSize = 68;
    const photoX = (W - photoSize) / 2;
    const photoY = 55;
    const radius = 6;

    doc
      .roundedRect(photoX, photoY, photoSize, photoSize, radius)
      .lineWidth(2)
      .strokeColor(COLORS.gold)
      .stroke();

    doc.save();
    doc.roundedRect(photoX + 2, photoY + 2, photoSize - 4, photoSize - 4, radius - 1).clip();
    if (opts.photoBuffer) {
      doc.image(opts.photoBuffer, photoX + 2, photoY + 2, {
        width: photoSize - 4,
        height: photoSize - 4,
      });
    } else {
      doc.rect(photoX, photoY, photoSize, photoSize).fill(COLORS.parchment);
      const initiales = `${opts.prenoms.charAt(0)}${opts.nom.charAt(0)}`.toUpperCase();
      doc
        .fillColor(COLORS.navy)
        .font("Times-Bold")
        .fontSize(22)
        .text(initiales, photoX, photoY + photoSize / 2 - 14, { width: photoSize, align: "center" });
    }
    doc.restore();

    // --- Nom / rôle / paroisse ---
    let y = photoY + photoSize + 8;
    doc
      .fillColor(COLORS.navy)
      .font("Times-Bold")
      .fontSize(10)
      .text(`${opts.prenoms.toUpperCase()} ${opts.nom.toUpperCase()}`, 6, y, {
        width: W - 12,
        align: "center",
      });

    y += 13;
    const roleLabel = ROLE_LABELS[opts.role];
    const fonctionLigne = [opts.statut === "moniteur" ? "Moniteur" : "Assistant", opts.poste]
      .filter(Boolean)
      .join(" · ");
    doc
      .fillColor(COLORS.ink)
      .font("Helvetica")
      .fontSize(6.5)
      .text(roleLabel || fonctionLigne, 6, y, { width: W - 12, align: "center" });

    if (opts.paroisseNom) {
      y += 9;
      doc
        .fillColor(COLORS.ink)
        .opacity(0.7)
        .font("Helvetica")
        .fontSize(6)
        .text(`Paroisse : ${opts.paroisseNom}`, 6, y, { width: W - 12, align: "center" })
        .opacity(1);
    }

    // --- Identifiant ---
    y += 12;
    const idBoxWidth = 90;
    const idBoxX = (W - idBoxWidth) / 2;
    doc
      .roundedRect(idBoxX, y, idBoxWidth, 13, 3)
      .fillAndStroke(COLORS.parchment, COLORS.line);
    doc
      .fillColor(COLORS.navy)
      .font("Courier-Bold")
      .fontSize(7)
      .text(opts.identifiant, idBoxX, y + 3.5, { width: idBoxWidth, align: "center" });

    // --- QR code ---
    y += 20;
    const qrSize = 42;
    const qrX = (W - qrSize) / 2;
    doc.image(opts.qrBuffer, qrX, y, { width: qrSize, height: qrSize });

    y += qrSize + 2;
    doc
      .fillColor(COLORS.ink)
      .opacity(0.5)
      .font("Helvetica")
      .fontSize(4.5)
      .text("SCANNER POUR VÉRIFIER", 6, y, { width: W - 12, align: "center" })
      .opacity(1);

    // --- Pied navy ---
    doc.rect(0, H - 12, W, 12).fill(COLORS.navy);
    doc
      .fillColor(COLORS.white)
      .opacity(0.7)
      .font("Helvetica")
      .fontSize(4.5)
      .text("Carte de membre — Cours Bibliques", 6, H - 8, { width: W - 12, align: "center" })
      .opacity(1);

    doc.end();
  });
}