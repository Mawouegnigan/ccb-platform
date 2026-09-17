import crypto from "crypto";

function getSecret(): string {
  const secret = process.env.QR_SIGNING_SECRET;
  if (!secret) {
    throw new Error("QR_SIGNING_SECRET n'est pas défini dans l'environnement.");
  }
  return secret;
}

export function signMembreToken(membreId: string, statutValidation: string): string {
  const payload = `${membreId}:${statutValidation}`;
  return crypto.createHmac("sha256", getSecret()).update(payload).digest("hex").slice(0, 24);
}

export function verifyMembreToken(
  membreId: string,
  statutValidation: string,
  token: string
): boolean {
  const expected = signMembreToken(membreId, statutValidation);
  const a = Buffer.from(expected);
  const b = Buffer.from(token || "");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function buildVerifyUrl(membreId: string, statutValidation: string): string {
  const token = signMembreToken(membreId, statutValidation);
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return `${base}/verify/${membreId}?token=${token}`;
}