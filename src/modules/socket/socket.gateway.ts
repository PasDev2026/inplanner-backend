import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import * as process from 'node:process';
import { SocketService } from './socket.service';
import { AuthService } from '../../app/auth/auth.service';

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL,
    credentials: true,
  },
  pingInterval: 25000,
  pingTimeout: 5000,
})
export class SocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(SocketGateway.name);

  private readonly inactivityTimeout: number;

  private readonly checkIntervalMs = 30_000;

  private inactivityTimer: ReturnType<typeof setInterval> | null = null;

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly socketService: SocketService,
    private readonly jwtService: JwtService,
    private readonly authService: AuthService,
  ) {
    this.inactivityTimeout = parseInt(
      process.env.SOCKET_INACTIVITY_TIMEOUT ?? '900000',
      10,
    );
  }

  afterInit(server: Server): void {
    this.socketService.setServer(server);
    this.startInactivityCheck();
    this.logger.log(
      `Socket.IO inicializado — timeout de inactividad: ${this.inactivityTimeout}ms`,
    );
  }

  async handleConnection(client: Socket): Promise<void> {
    try {
      const cookies = client.handshake.headers.cookie || '';
      const token = cookies
        .split('; ')
        .find((c) => c.startsWith('access_token='))
        ?.split('=')[1];

      if (!token) {
        client.emit('error', { message: 'Token no proporcionado' });
        client.disconnect(true);
        return;
      }

      const payload = await this.jwtService.verifyAsync<{ sub: number }>(
        token,
        {
          secret: process.env.JWT_SECRET,
        },
      );

      this.socketService.addConnection(client.id, payload.sub);
      void client.join(`user_${payload.sub}`);

      this.logger.log(
        `Cliente conectado — socket=${client.id} user=${payload.sub}`,
      );
    } catch {
      client.emit('error', { message: 'Token inválido o expirado' });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    const userId = this.socketService.removeConnection(client.id);

    if (userId !== null) {
      this.logger.log(
        `Cliente desconectado — socket=${client.id} user=${userId}`,
      );
    }
  }

  @SubscribeMessage('ping')
  handlePing(client: Socket): void {
    this.socketService.updateActivity(client.id);
    client.emit('pong');
  }

  @SubscribeMessage('force-disconnect')
  handleForceDisconnect(client: Socket): void {
    const userId = this.socketService.removeConnection(client.id);
    if (userId !== null) {
      client.emit('force-logout', { message: 'Sesión cerrada por el usuario' });
      client.disconnect(true);
    }
  }

  private startInactivityCheck(): void {
    this.inactivityTimer = setInterval(() => {
      this.checkInactivity().catch((err) =>
        this.logger.error('Error en verificación de inactividad', err),
      );
    }, this.checkIntervalMs);
  }

  private async checkInactivity(): Promise<void> {
    if (!this.server) return;

    const inactiveSockets = this.socketService.getInactiveSocketIds(
      this.inactivityTimeout,
    );

    if (inactiveSockets.length > 0) {
      this.logger.log(
        `Inactividad detectada — ${inactiveSockets.length} socket(s)`,
      );
    }

    for (const socketId of inactiveSockets) {
      const socket = this.server.sockets.sockets.get(socketId);
      const userId = this.socketService.removeConnection(socketId);

      if (userId !== null) {
        socket?.emit('force-logout', {
          message: 'Sesión expirada por inactividad',
        });
        socket?.disconnect(true);

        await this.authService.revokeAllTokens(userId).catch(() => {
          this.logger.warn(`Error al revocar tokens del usuario ${userId}`);
        });
      }
    }
  }

  onGatewayShutdown(): void {
    if (this.inactivityTimer) {
      clearInterval(this.inactivityTimer);
      this.inactivityTimer = null;
    }
  }
}
