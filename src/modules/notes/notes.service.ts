import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { NoteEntity } from './note.entity';
import { CreateNoteDto } from './dto/create-note.dto';
import { UpdateNoteDto } from './dto/update-note.dto';
import { QueryNoteDto } from './dto/query-note.dto';
import { PaginatedResult } from '../../common/interfaces/pagination.interface';

@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(NoteEntity)
    private readonly noteRepository: Repository<NoteEntity>,
  ) {}

  async create(dto: CreateNoteDto, createdById: number): Promise<NoteEntity> {
    const note = new NoteEntity();
    Object.assign(note, dto, { created_by_id: createdById });
    return this.noteRepository.save(note);
  }

  async findAll(query: QueryNoteDto): Promise<PaginatedResult<NoteEntity>> {
    const { page = 1, limit = 50, task_id } = query;
    const skip = (page - 1) * limit;

    const where: FindOptionsWhere<NoteEntity> = {};

    if (task_id !== undefined) {
      where.task_id = task_id;
    }

    const [data, total] = await this.noteRepository.findAndCount({
      where,
      skip,
      take: limit,
      order: { created_at: 'DESC' },
    });

    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number): Promise<NoteEntity> {
    const note = await this.noteRepository.findOne({ where: { id_note: id } });
    if (!note) {
      throw new NotFoundException(`Nota con ID ${id} no encontrada`);
    }
    return note;
  }

  async update(id: number, dto: UpdateNoteDto): Promise<NoteEntity> {
    const note = await this.findOne(id);
    Object.assign(note, dto);
    return this.noteRepository.save(note);
  }

  async remove(id: number): Promise<void> {
    const note = await this.findOne(id);
    await this.noteRepository.remove(note);
  }
}
