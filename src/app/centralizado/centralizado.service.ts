import { HttpException, Injectable } from '@nestjs/common';
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

  async getAsignaciones(usuarioUuid: string, bearerToken: string) {
    const [trabajador, roles] = await Promise.all([
      this.trabajadores
        .getTrabajador(usuarioUuid, bearerToken)
        .catch((error: unknown) => {
          if (error instanceof HttpException && error.getStatus() === 404) {
            return null;
          }
          throw error;
        }),
      this.api.getRoles(bearerToken),
    ]);

    if (!trabajador) return { asignaciones: [] };

    const rolIdByCode = new Map(roles.map((r) => [r.codigo, r.id]));

    return {
      asignaciones: trabajador.sedes.map((sede) => ({
        sede_uuid: sede.sede_uuid,
        rol_uuid: sede.roles[0] ? (rolIdByCode.get(sede.roles[0]) ?? '') : '',
        especialidad_uuids: sede.especialidades.map(
          (especialidad) => especialidad.uuid_especialidad,
        ),
      })),
    };
  }

  searchDni(documento: string) {
    return this.trabajadores.searchDni(documento);
  }

  getTiposDocumento() {
    return this.trabajadores.getTiposDocumento();
  }
}
