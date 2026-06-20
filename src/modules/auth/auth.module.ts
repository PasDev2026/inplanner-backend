import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as process from 'node:process';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CsrfService } from './csrf.service';
import { RefreshTokenEntity } from './refresh-token.entity';
import { UserRoleEntity } from '../users/user-role.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: '15m' },
    }),
    TypeOrmModule.forFeature([RefreshTokenEntity, UserRoleEntity]),
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, CsrfService],
  exports: [AuthService, CsrfService, JwtModule],
})
export class AuthModule {}
