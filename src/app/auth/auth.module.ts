import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RefreshTokenEntity } from './entities/refresh-token.entity';
import { UserRoleEntity } from '../users/entities/user-role.entity';
import { UsersModule } from '../users/users.module';
import { REFRESH_TOKEN_REPOSITORY } from './repository/refresh-token-repository.interface';
import { RefreshTokenTypeormRepository } from './persistence/refresh-token.typeorm.repository';
import { LoginUseCase } from './use-cases/login.use-case';
import { RefreshUseCase } from './use-cases/refresh.use-case';
import { GetProfileUseCase } from './use-cases/get-profile.use-case';
import { LogoutUseCase } from './use-cases/logout.use-case';
import { UpdateProfileUseCase } from './use-cases/update-profile.use-case';
import { UpdatePasswordUseCase } from './use-cases/update-password.use-case';
import { CheckPasswordUseCase } from './use-cases/check-password.use-case';
import { RevokeTokensUseCase } from './use-cases/revoke-tokens.use-case';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get('JWT_SECRET'),
        signOptions: { expiresIn: config.get('JWT_EXPIRES_IN') },
      }),
    }),
    TypeOrmModule.forFeature([RefreshTokenEntity, UserRoleEntity]),
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [
    {
      provide: REFRESH_TOKEN_REPOSITORY,
      useClass: RefreshTokenTypeormRepository,
    },
    LoginUseCase,
    RefreshUseCase,
    GetProfileUseCase,
    LogoutUseCase,
    UpdateProfileUseCase,
    UpdatePasswordUseCase,
    CheckPasswordUseCase,
    RevokeTokensUseCase,
    AuthService,
  ],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
