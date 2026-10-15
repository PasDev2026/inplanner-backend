import { Injectable } from '@nestjs/common';
import { randomBytes } from 'node:crypto';
import { AUTH_CODE_TTL_SECONDS } from '../constants/oauth.constants';
import type { AuthCodeRecord } from '../interfaces/oauth.interface';

/**
 * Almacén **en memoria** de códigos de autorización (efímeros, 60 s).
 * Un código es de un solo uso.
 */
@Injectable()
export class AuthorizationCodeStore {
  private readonly codes = new Map<string, AuthCodeRecord>();

  create(params: Omit<AuthCodeRecord, 'expiresAt'>): string {
    this.purgeExpired();
    const code = randomBytes(32).toString('base64url');
    this.codes.set(code, {
      ...params,
      expiresAt: Date.now() + AUTH_CODE_TTL_SECONDS * 1000,
    });
    return code;
  }

  consume(code: string): AuthCodeRecord | null {
    const record = this.codes.get(code);
    if (!record) return null;
    this.codes.delete(code); // un solo uso
    return record.expiresAt < Date.now() ? null : record;
  }

  private purgeExpired(): void {
    const now = Date.now();
    for (const [code, record] of this.codes) {
      if (record.expiresAt < now) this.codes.delete(code);
    }
  }
}
