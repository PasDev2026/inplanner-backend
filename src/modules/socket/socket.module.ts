import { Global, Module } from '@nestjs/common';
import { AuthModule } from '../../app/auth/auth.module';
import { SocketGateway } from './socket.gateway';
import { SocketService } from './socket.service';

@Global()
@Module({
  imports: [AuthModule],
  providers: [SocketGateway, SocketService],
  exports: [SocketService],
})
export class SocketModule {}
