import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RolEntity } from '../entities/rol.entity';
import { SedeEntity } from '../entities/sede.entity';
import type { ICentralizadoRepository } from '../repository/centralizado-repository.interface';

@Injectable()
export class CentralizadoTypeormRepository implements ICentralizadoRepository {
  constructor(
    @InjectRepository(RolEntity)
    private readonly rolRepo: Repository<RolEntity>,
    @InjectRepository(SedeEntity)
    private readonly sedeRepo: Repository<SedeEntity>,
  ) {}

  async findActiveRoles(): Promise<RolEntity[]> {
    return this.rolRepo.find({
      where: { estado: true },
      order: { nom_rol: 'ASC' },
    });
  }

  async findActiveSedes(): Promise<SedeEntity[]> {
    return this.sedeRepo.find({
      where: { estado: true },
      order: { nom_sede: 'ASC' },
    });
  }
}
