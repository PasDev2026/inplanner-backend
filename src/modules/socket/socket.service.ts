import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Server } from 'socket.io';
import { RefreshTokenEntity } from '../auth/refresh-token.entity';
import { ActiveConnection } from './interfaces/active-connection.interface';

@Injectable()
export class SocketService {
  private readonly logger = new Logger(SocketService.name);

  private server: Server | null = null;

  private readonly activeUsers: Map<number, Set<string>> = new Map();

  private readonly connections: Map<string, ActiveConnection> = new Map();

  constructor(
    @InjectRepository(RefreshTokenEntity)
    private readonly refreshTokenRepository: Repository<RefreshTokenEntity>,
  ) {}

  setServer(server: Server): void {
    this.server = server;
  }

  addConnection(socketId: string, userId: number): void {
    this.connections.set(socketId, { userId, lastActivity: new Date() });

    if (!this.activeUsers.has(userId)) {
      this.activeUsers.set(userId, new Set());
    }
    this.activeUsers.get(userId)!.add(socketId);
  }

  removeConnection(socketId: string): number | null {
    const conn = this.connections.get(socketId);
    if (!conn) return null;

    this.connections.delete(socketId);

    const userSockets = this.activeUsers.get(conn.userId);
    if (userSockets) {
      userSockets.delete(socketId);
      if (userSockets.size === 0) {
        this.activeUsers.delete(conn.userId);
      }
    }

    return conn.userId;
  }

  updateActivity(socketId: string): void {
    const conn = this.connections.get(socketId);
    if (conn) {
      conn.lastActivity = new Date();
    }
  }

  getInactiveSocketIds(timeoutMs: number): string[] {
    const now = Date.now();
    const inactive: string[] = [];

    for (const [socketId, conn] of this.connections.entries()) {
      if (now - conn.lastActivity.getTime() > timeoutMs) {
        inactive.push(socketId);
      }
    }

    return inactive;
  }

  sendToUser(userId: number, event: string, data: unknown): void {
    this.server?.to(`user_${userId}`).emit(event, data);
  }

  sendToAll(event: string, data: unknown): void {
    this.server?.emit(event, data);
  }

  getActiveUsers(): number[] {
    return Array.from(this.activeUsers.keys());
  }

  isUserActive(userId: number): boolean {
    const userSockets = this.activeUsers.get(userId);
    return !!userSockets && userSockets.size > 0;
  }

  async forceLogout(userId: number, message: string): Promise<boolean> {
    await this.refreshTokenRepository
      .update({ user_id: userId, revoked: false }, { revoked: true })
      .catch((err: Error) => {
        this.logger.warn(
          `Error revocando tokens del usuario ${userId}: ${err.message}`,
        );
      });

    const userSockets = this.activeUsers.get(userId);
    if (!userSockets || userSockets.size === 0) return false;

    const socketIds = Array.from(userSockets);

    this.server?.to(`user_${userId}`).emit('force-logout', { message });

    for (const socketId of socketIds) {
      this.connections.delete(socketId);
    }
    this.activeUsers.delete(userId);

    for (const socketId of socketIds) {
      this.server?.sockets.sockets.get(socketId)?.disconnect(true);
    }

    this.logger.log(
      `Force-logout ejecutado — userId=${userId} sockets=${socketIds.length}`,
    );
    return true;
  }
}
