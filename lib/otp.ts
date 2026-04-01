import crypto from "crypto";

/** Gera um OTP numérico de 6 dígitos usando crypto seguro */
export function generateOtp(): string {
  return String(crypto.randomInt(100000, 1000000));
}

/** Hash simples do OTP para armazenar no banco (SHA-256) */
export function hashOtp(code: string): string {
  return crypto.createHash("sha256").update(code).digest("hex");
}

export function verifyOtp(plain: string, hashed: string): boolean {
  const plainHashed = Buffer.from(hashOtp(plain));
  const storedHashed = Buffer.from(hashed);
  if (plainHashed.length !== storedHashed.length) return false;
  return crypto.timingSafeEqual(plainHashed, storedHashed);
}
