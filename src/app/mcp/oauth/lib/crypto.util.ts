import { createHash, timingSafeEqual } from 'node:crypto';

/** Hash sha256 (hex) de un token, para no almacenar refresh tokens en claro. */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** Comparación de strings en tiempo constante (evita filtrar por timing). */
export function safeEqual(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) return false;
  return timingSafeEqual(bufferA, bufferB);
}
