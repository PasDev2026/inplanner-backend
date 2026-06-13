import { Injectable } from '@nestjs/common';

@Injectable()
export class RateLimitService {
  private failedAttempts: Map<string, { count: number; blockExpires: number }> = new Map();
  private readonly MAX_ATTEMPTS = 10;
  private readonly BLOCK_TIME = 15 * 60 * 1000;

  trackFailedAttempt(ip: string): boolean {
    const now = Date.now();
    const attempt = this.failedAttempts.get(ip);

    if (attempt && attempt.blockExpires > now) return true;
    if (attempt && attempt.blockExpires <= now) {
      this.failedAttempts.set(ip, { count: 1, blockExpires: 0 });
      return false;
    }

    const count = attempt ? attempt.count + 1 : 1;
    if (count >= this.MAX_ATTEMPTS) {
      this.failedAttempts.set(ip, { count, blockExpires: now + this.BLOCK_TIME });
      return true;
    }

    this.failedAttempts.set(ip, { count, blockExpires: 0 });
    return false;
  }

  isBlocked(ip: string): boolean {
    const attempt = this.failedAttempts.get(ip);
    return !!attempt && attempt.blockExpires > Date.now();
  }

  resetAttempts(ip: string): void {
    this.failedAttempts.delete(ip);
  }
}
