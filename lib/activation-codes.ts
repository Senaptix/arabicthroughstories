import "server-only";
import { createHash, randomBytes } from "node:crypto";

const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTVWXYZ";
const RANDOM_LIMIT = Math.floor(256 / CODE_ALPHABET.length) * CODE_ALPHABET.length;

export function normaliseActivationCode(value: string) {
  return value.trim().replaceAll("-", "").toUpperCase();
}

export function looksLikeActivationCode(value: string) {
  return normaliseActivationCode(value).startsWith("QK");
}

export function generateActivationCode() {
  let body = "";
  while (body.length < 8) {
    for (const byte of randomBytes(16)) {
      if (byte >= RANDOM_LIMIT) continue;
      body += CODE_ALPHABET[byte % CODE_ALPHABET.length];
      if (body.length === 8) break;
    }
  }
  return `QK-${body.slice(0, 4)}-${body.slice(4)}`;
}

export function redemptionRateKey(email: string, clientAddress: string | null) {
  const address = clientAddress?.trim() || "unknown";
  return createHash("sha256")
    .update(`${email.trim().toLowerCase()}:${address}`)
    .digest("hex");
}

export function activationIssuerSecret() {
  const value = process.env.ACTIVATION_ISSUER_SECRET?.trim();
  if (!value || value.length < 32) {
    throw new Error("ACTIVATION_ISSUER_SECRET is not configured.");
  }
  return value;
}
