import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RolEntity } from './entities/rol.entity';
import { SedeEntity } from './entities/sede.entity';

@Injectable()
export class CentralizadoService {
  constructor(
    @InjectRepository(RolEntity)
    private readonly rolRepository: Repository<RolEntity>,
    @InjectRepository(SedeEntity)
    private readonly sedeRepository: Repository<SedeEntity>,
  ) {}

  async findAll() {
    const [roles, sedes] = await Promise.all([
      this.rolRepository.find({
        where: { estado: true },
        order: { nom_rol: 'ASC' },
      }),
      this.sedeRepository.find({
        where: { estado: true },
        order: { nom_sede: 'ASC' },
      }),
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
