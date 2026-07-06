import { Injectable } from '@nestjs/common';
import { LoginUseCase } from './use-cases/login.use-case';
import { RefreshUseCase } from './use-cases/refresh.use-case';
import { GetProfileUseCase } from './use-cases/get-profile.use-case';
import { LogoutUseCase } from './use-cases/logout.use-case';
import { UpdateProfileUseCase } from './use-cases/update-profile.use-case';
import { UpdatePasswordUseCase } from './use-cases/update-password.use-case';
import { CheckPasswordUseCase } from './use-cases/check-password.use-case';
import { RevokeTokensUseCase } from './use-cases/revoke-tokens.use-case';
import { LoginDto } from './dtos/login.dto';
import { RefreshTokenDto } from './dtos/refresh-token.dto';
import { UpdateProfileDto } from './dtos/update-profile.dto';
import { CheckPasswordDto } from './dtos/check-password.dto';
import { UpdatePasswordDto } from './dtos/update-password.dto';
import type { LoginResponse } from './interfaces/auth-types';

@Injectable()
export class AuthService {
  constructor(
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshUseCase: RefreshUseCase,
    private readonly getProfileUseCase: GetProfileUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly updateProfileUseCase: UpdateProfileUseCase,
    private readonly updatePasswordUseCase: UpdatePasswordUseCase,
    private readonly checkPasswordUseCase: CheckPasswordUseCase,
    private readonly revokeTokensUseCase: RevokeTokensUseCase,
  ) {}

  async login(loginDto: LoginDto): Promise<LoginResponse> {
    return this.loginUseCase.execute(loginDto);
  }

  async refresh(dto: RefreshTokenDto): Promise<{ accessToken: string }> {
    return this.refreshUseCase.execute(dto);
  }

  async getProfile(userId: number) {
    return this.getProfileUseCase.execute(userId);
  }

  async logout(dto: RefreshTokenDto): Promise<{ message: string }> {
    return this.logoutUseCase.execute(dto);
  }

  async revokeAllTokens(userId: number): Promise<void> {
    return this.revokeTokensUseCase.execute(userId);
  }

  async updateProfile(
    userId: number,
    dto: UpdateProfileDto,
  ): Promise<{ message: string }> {
    return this.updateProfileUseCase.execute(userId, dto);
  }

  async updatePassword(
    userId: number,
    dto: UpdatePasswordDto,
  ): Promise<{ message: string }> {
    return this.updatePasswordUseCase.execute(userId, dto);
  }

  async checkPassword(
    userId: number,
    dto: CheckPasswordDto,
  ): Promise<{ message: string }> {
    return this.checkPasswordUseCase.execute(userId, dto);
  }
}
