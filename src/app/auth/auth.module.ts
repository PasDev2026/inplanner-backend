import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { jwtPublicKey } from '../../config/envs';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthCentralizadoService } from '../../libs/services/auth-centralizado.service';
import { UserEntity } from '../users/entities/user.entity';

@Module({
  imports: [
    JwtModule.register({
      publicKey: jwtPublicKey,
      verifyOptions: { algorithms: ['RS256'] },
    }),
    TypeOrmModule.forFeature([UserEntity]),
  ],
  controllers: [AuthController],
  providers: [AuthCentralizadoService, AuthService],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
