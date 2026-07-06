import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../../app/auth/auth.module';
import { RefreshTokenEntity } from '../../app/auth/entities/refresh-token.entity';
import { SocketGateway } from './socket.gateway';
import { SocketService } from './socket.service';

@Global()
@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([RefreshTokenEntity])],
  providers: [SocketGateway, SocketService],
  exports: [SocketService],
})
export class SocketModule {}
