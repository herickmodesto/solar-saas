import crypto from "crypto";

/** Gera um OTP numérico de 4 dígitos usando crypto seguro */
export function generateOtp(): string {
  return String(crypto.randomInt(1000, 10000));
}

/** Hash simples do OTP para armazenar no banco (SHA-256) */
export function hashOtp(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

export function verifyOtp(plain: string, hashed: string): boolean {
  return hashOtp(plain) === hashed;
}
