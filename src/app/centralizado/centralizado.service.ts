import { Injectable, Inject } from '@nestjs/common';
import type { ICentralizadoRepository } from './repository/centralizado-repository.interface';
import { CENTRALIZADO_REPOSITORY } from './repository/centralizado-repository.interface';

@Injectable()
export class CentralizadoService {
  constructor(
    @Inject(CENTRALIZADO_REPOSITORY)
    private readonly repo: ICentralizadoRepository,
  ) {}

  async findAll() {
    const [roles, sedes] = await Promise.all([
      this.repo.findActiveRoles(),
      this.repo.findActiveSedes(),
    ]);

    return {
      roles: roles.map((r) => ({ id: Number(r.id_rol), nombre: r.nom_rol })),
      sedes: sedes.map((s) => ({
        id: Number(s.id_sede),
        nombre: s.nom_sede.replace(/^INSALUD\s+/i, '').trim(),
      })),
    };
  }
}
