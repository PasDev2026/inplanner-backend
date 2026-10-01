import { Injectable } from '@nestjs/common';
import { CentralizadoApiService } from '../../libs/services/centralizado-api.service';
import { TrabajadoresCentralizadoService } from '../../libs/services/trabajadores-centralizado.service';

@Injectable()
export class CentralizadoService {
  constructor(
    private readonly api: CentralizadoApiService,
    private readonly trabajadores: TrabajadoresCentralizadoService,
  ) {}

  async findAll(bearerToken: string) {
    const [roles, sedes] = await Promise.all([
      this.api.getRoles(bearerToken),
      this.api.getSedes(bearerToken),
    ]);

    return { roles, sedes };
  }

  searchDni(documento: string) {
    return this.trabajadores.searchDni(documento);
  }

  getTiposDocumento() {
    return this.trabajadores.getTiposDocumento();
  }
}
