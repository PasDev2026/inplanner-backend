import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { SocketService } from '../src/modules/socket/socket.service';
import { SocketGateway } from '../src/modules/socket/socket.gateway';
import { AuthService } from '../src/app/auth/auth.service';
import { RefreshTokenEntity } from '../src/app/auth/entities/refresh-token.entity';
import { createMock, Mockify } from './helpers/mock-factory';

describe('SocketModule', () => {
  describe('SocketService', () => {
    let service: SocketService;
    const refreshTokenRepo = {
      update: jest.fn<any, any>(),
    };

    beforeAll(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          {
            provide: getRepositoryToken(RefreshTokenEntity),
            useValue: refreshTokenRepo,
          },
          SocketService,
        ],
      }).compile();

      service = module.get(SocketService);
    });

    beforeEach(() => {
      jest.resetAllMocks();
      // re-set the mock since resetAllMocks clears the map state
    });

    it('should add and remove a connection', () => {
      service.addConnection('socket-1', 42);

      expect(service.isUserActive(42)).toBe(true);

      const userId = service.removeConnection('socket-1');
      expect(userId).toBe(42);
      expect(service.isUserActive(42)).toBe(false);
    });

    it('should return null when removing unknown socket', () => {
      const result = service.removeConnection('unknown');
      expect(result).toBeNull();
    });

    it('should update activity timestamp', () => {
      service.addConnection('socket-1', 1);

      service.updateActivity('socket-1');

      const inactive = service.getInactiveSocketIds(10_000);
      expect(inactive).not.toContain('socket-1');
    });

    it('should return inactive socket ids', async () => {
      service.addConnection('socket-1', 1);

      // Wait a tick then check with 0ms timeout (everything older than now should be inactive)
      await new Promise((r) => setTimeout(r, 5));
      const inactive = service.getInactiveSocketIds(0);

      expect(inactive).toContain('socket-1');
    });

    it('should return active users list', () => {
      service.addConnection('s1', 10);
      service.addConnection('s2', 20);

      expect(service.getActiveUsers()).toEqual(
        expect.arrayContaining([10, 20]),
      );
    });

    it('should disconnect all sockets for a user on forceLogout', async () => {
      refreshTokenRepo.update.mockResolvedValue({ affected: 1 });
      const mockSocket = { disconnect: jest.fn() };
      const mockServer = {
        to: jest.fn().mockReturnThis(),
        emit: jest.fn(),
        sockets: {
          sockets: {
            get: jest.fn().mockReturnValue(mockSocket),
          },
        },
      } as unknown as jest.Mocked<Server>;
      service.setServer(mockServer);
      service.addConnection('s1', 5);

      const result = await service.forceLogout(5, 'Test logout');

      expect(result).toBe(true);
      expect(refreshTokenRepo.update).toHaveBeenCalledWith(
        { user_id: 5, revoked: false },
        { revoked: true },
      );
      expect(mockSocket.disconnect).toHaveBeenCalled();
      expect(service.isUserActive(5)).toBe(false);
    });

    it('should return false on forceLogout for inactive user', async () => {
      refreshTokenRepo.update.mockResolvedValue({ affected: 0 });
      const result = await service.forceLogout(999, 'nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('SocketGateway', () => {
    /* eslint-disable @typescript-eslint/unbound-method */
    let gateway: SocketGateway;
    let socketService: Mockify<SocketService>;
    let jwtService: Mockify<JwtService>;
    let authService: Mockify<AuthService>;
    const mockClient = {
      id: 'socket-1',
      handshake: { headers: { cookie: 'access_token=valid-token' } },
      emit: jest.fn(),
      disconnect: jest.fn(),
      join: jest.fn(),
    } as unknown as jest.Mocked<Socket>;

    beforeAll(async () => {
      socketService = createMock<SocketService>([
        'setServer',
        'addConnection',
        'removeConnection',
        'updateActivity',
        'getInactiveSocketIds',
      ]);
      jwtService = createMock<JwtService>(['verifyAsync']);
      authService = createMock<AuthService>(['revokeAllTokens']);

      const module: TestingModule = await Test.createTestingModule({
        providers: [
          { provide: SocketService, useValue: socketService },
          { provide: JwtService, useValue: jwtService },
          { provide: AuthService, useValue: authService },
          SocketGateway,
        ],
      }).compile();

      gateway = module.get(SocketGateway);
    });

    beforeEach(() => {
      jest.resetAllMocks();
    });

    it('should authenticate and add connection on handleConnection', async () => {
      jwtService.verifyAsync.mockResolvedValue({ sub: 42 });

      await gateway.handleConnection(mockClient);

      expect(socketService.addConnection).toHaveBeenCalledWith('socket-1', 42);
      expect(mockClient.join).toHaveBeenCalledWith('user_42');
    });

    it('should disconnect client when no token provided', async () => {
      const noTokenClient = {
        id: 'socket-2',
        handshake: { headers: { cookie: '' } },
        emit: jest.fn(),
        disconnect: jest.fn(),
      } as unknown as jest.Mocked<Socket>;

      await gateway.handleConnection(noTokenClient);

      expect(noTokenClient.emit).toHaveBeenCalledWith('error', {
        message: 'Token no proporcionado',
      });
      expect(noTokenClient.disconnect).toHaveBeenCalledWith(true);
    });

    it('should disconnect client on invalid token', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('bad token'));

      await gateway.handleConnection(mockClient);

      expect(mockClient.emit).toHaveBeenCalledWith('error', {
        message: 'Token inválido o expirado',
      });
      expect(mockClient.disconnect).toHaveBeenCalledWith(true);
    });

    it('should remove connection on handleDisconnect', () => {
      socketService.removeConnection.mockReturnValue(42);

      gateway.handleDisconnect(mockClient);

      expect(socketService.removeConnection).toHaveBeenCalledWith('socket-1');
    });

    it('should update activity on ping', () => {
      gateway.handlePing(mockClient);

      expect(socketService.updateActivity).toHaveBeenCalledWith('socket-1');
      expect(mockClient.emit).toHaveBeenCalledWith('pong');
    });

    it('should remove connection and disconnect on force-disconnect', () => {
      socketService.removeConnection.mockReturnValue(42);

      gateway.handleForceDisconnect(mockClient);

      expect(socketService.removeConnection).toHaveBeenCalledWith('socket-1');
      expect(mockClient.disconnect).toHaveBeenCalledWith(true);
    });
  });
});
