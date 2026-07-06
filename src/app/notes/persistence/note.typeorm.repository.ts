import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { NoteEntity } from '../entities/note.entity';
import type { INoteRepository } from '../repository/note-repository.interface';
import { QueryNoteDto } from '../dtos/query-note.dto';
import { PaginatedResult } from '../../../common/interfaces/pagination.interface';

@Injectable()
export class NoteTypeormRepository implements INoteRepository {
  constructor(
    @InjectRepository(NoteEntity)
    private readonly repo: Repository<NoteEntity>,
  ) {}

  async save(note: NoteEntity): Promise<NoteEntity> {
    return this.repo.save(note);
  }

  async findWithPagination(
    query: QueryNoteDto,
  ): Promise<PaginatedResult<NoteEntity>> {
    const { page = 1, limit = 50, task_id } = query;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<NoteEntity> = {};

    if (task_id !== undefined) {
      where.task_id = task_id;
    }

    const [data, total] = await this.repo.findAndCount({
      where,
      skip,
      take: limit,
      order: { created_at: 'DESC' },
    });

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOneById(id: number): Promise<NoteEntity | null> {
    return this.repo.findOne({ where: { id_note: id } });
  }

  async delete(note: NoteEntity): Promise<void> {
    await this.repo.remove(note);
  }
}
