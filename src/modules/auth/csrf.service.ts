import { Injectable } from '@nestjs/common';
import * as crypto from 'node:crypto';
import * as process from 'node:process';

const TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000;
interface TokenPayload {
  exp: number;
  random: string;
}

@Injectable()
export class CsrfService {
  private readonly secret = process.env.JWT_SECRET || 'fallback_secret';

  generateToken(): string {
    const payload = Buffer.from(
      JSON.stringify({
        exp: Date.now() + TOKEN_EXPIRY_MS,
        random: crypto.randomUUID(),
      }),
    ).toString('base64');

    const signature = crypto
      .createHmac('sha256', this.secret)
      .update(payload)
      .digest('hex');

    return `${payload}.${signature}`;
  }

  validateToken(token: string): boolean {
    try {
      const parts = token.split('.');
      if (parts.length !== 2) return false;

      const [payload, signature] = parts;
      const expected = crypto
        .createHmac('sha256', this.secret)
        .update(payload)
        .digest('hex');

      if (signature !== expected) return false;

      const decoded = JSON.parse(
        Buffer.from(payload, 'base64').toString(),
      ) as TokenPayload;
      return Date.now() <= decoded.exp;
    } catch {
      return false;
    }
  }
}
