import { Injectable } from '@nestjs/common';
import { CentralizadoApiService } from '../../libs/services/centralizado-api.service';

@Injectable()
export class CentralizadoService {
  constructor(private readonly api: CentralizadoApiService) {}

  async findAll(bearerToken: string) {
    const [roles, sedes] = await Promise.all([
      this.api.getRoles(bearerToken),
      this.api.getSedes(bearerToken),
    ]);

    return { roles, sedes };
  }
}
