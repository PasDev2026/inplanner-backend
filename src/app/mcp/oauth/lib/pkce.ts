import { createHash } from 'node:crypto';
import { safeEqual } from './crypto.util';

/** Verifica un `code_verifier` de PKCE contra su `code_challenge` (método S256). */
export function verifyPkce(
  verifier: string,
  challenge: string,
  method: string,
): boolean {
  if (method !== 'S256' || !verifier || !challenge) return false;
  const computed = createHash('sha256').update(verifier).digest('base64url');
  return safeEqual(computed, challenge);
}
