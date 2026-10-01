import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { USERS_REPOSITORY } from '../repository/user-repository.interface';
import type { IUsersRepository } from '../repository/user-repository.interface';
import { UserEntity } from '../entities/user.entity';
import { AreaEntity } from '../../areas/entities/area.entity';
import { CreateUserDto } from '../dtos/create-user.dto';
import {
  TrabajadoresCentralizadoService,
  type CreateTrabajadorAsignacion,
  type TrabajadorDetalle,
} from '../../../libs/services/trabajadores-centralizado.service';

@Injectable()
export class CreateUserUseCase {
  constructor(
    private readonly trabajadores: TrabajadoresCentralizadoService,
    @Inject(USERS_REPOSITORY)
    private readonly userRepo: IUsersRepository,
  ) {}

  async execute(dto: CreateUserDto, bearerToken: string): Promise<UserEntity> {
    if (dto.password !== dto.repetir_password) {
      throw new BadRequestException('Las contraseñas no coinciden');
    }

    const asignaciones = this.resolveAsignaciones(dto);

    const created = await this.trabajadores.createTrabajador(
      {
        tipo_documento_uuid: dto.tipo_documento_uuid,
        numero_documento: dto.numero_documento,
        nombres: dto.nombres,
        apellido_paterno: dto.apellido_paterno,
        apellido_materno: dto.apellido_materno,
        fecha_nacimiento: dto.fecha_nacimiento,
        sexo: dto.sexo,
        email: dto.email,
        telefono: dto.telefono,
        direccion: dto.direccion,
        password: dto.password,
        repetir_password: dto.repetir_password,
        asignaciones,
      },
      bearerToken,
    );

    const detalle = await this.trabajadores.getTrabajador(
      created.usuario_uuid,
      bearerToken,
    );

    const user = await this.upsertLocalUser(dto, detalle);

    return (await this.userRepo.findByIdWithRelations(user.id_user)) ?? user;
  }

  private resolveAsignaciones(
    dto: CreateUserDto,
  ): CreateTrabajadorAsignacion[] {
    return dto.asignaciones.map((asignacion) => ({
      sede_uuid: asignacion.sede_uuid,
      rol_uuid: asignacion.rol_uuid,
      especialidad_uuids: [],
    }));
  }

  private async upsertLocalUser(
    dto: CreateUserDto,
    detalle: TrabajadorDetalle,
  ): Promise<UserEntity> {
    const area = dto.area_id ? this.buildArea(dto.area_id) : undefined;
    const sedeId = dto.asignaciones[0]?.sede_uuid ?? null;

    const existing = await this.userRepo.findByPersonaUuid(
      detalle.persona_uuid,
    );
    if (existing) {
      Object.assign(existing, {
        numero_documento: detalle.numero_documento,
        name: detalle.nombres,
        apellido_paterno: detalle.apellido_paterno ?? '',
        apellido_materno: detalle.apellido_materno ?? '',
        email: detalle.email ?? '',
        telefono: detalle.telefono ?? '',
        sede_id: sedeId,
      });
      if (area) existing.area = area;
      return this.userRepo.save(existing);
    }

    const user = new UserEntity();
    Object.assign(user, {
      id_user: detalle.usuario_uuid,
      persona_uuid: detalle.persona_uuid,
      numero_documento: detalle.numero_documento,
      name: detalle.nombres,
      apellido_paterno: detalle.apellido_paterno ?? '',
      apellido_materno: detalle.apellido_materno ?? '',
      email: detalle.email ?? '',
      telefono: detalle.telefono ?? '',
      sede_id: sedeId,
      area,
    });
    return this.userRepo.save(user);
  }

  private buildArea(areaId: number): AreaEntity {
    const area = new AreaEntity();
    area.id_area = areaId;
    return area;
  }
}
