import { createHmac, timingSafeEqual } from 'crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SignatureService {
  private readonly secret: string;

  constructor(config: ConfigService) {
    this.secret = config.getOrThrow<string>('ATTACHMENT_SIG_SECRET');
  }

  sign(path: string): string {
    return createHmac('sha256', this.secret).update(path).digest('hex');
  }

  validate(path: string, signature: string | undefined): boolean {
    if (!signature) {
      return false;
    }
    const expected = createHmac('sha256', this.secret)
      .update(path)
      .digest('hex');
    const a = Buffer.from(signature, 'hex');
    const b = Buffer.from(expected, 'hex');
    return a.length === b.length && timingSafeEqual(a, b);
  }
}
