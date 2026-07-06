import { InjectionToken } from '@nestjs/common';
import { RolEntity } from '../entities/rol.entity';
import { SedeEntity } from '../entities/sede.entity';

export const CENTRALIZADO_REPOSITORY =
  'CENTRALIZADO_REPOSITORY' as InjectionToken;

export interface ICentralizadoRepository {
  findActiveRoles(): Promise<RolEntity[]>;
  findActiveSedes(): Promise<SedeEntity[]>;
}
