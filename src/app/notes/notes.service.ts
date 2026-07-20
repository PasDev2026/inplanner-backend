import { Injectable } from '@nestjs/common';
import { CreateNoteUseCase } from './use-cases/create-note.use-case';
import { FindNotesUseCase } from './use-cases/find-notes.use-case';
import { FindNoteUseCase } from './use-cases/find-note.use-case';
import { UpdateNoteUseCase } from './use-cases/update-note.use-case';
import { DeleteNoteUseCase } from './use-cases/delete-note.use-case';
import { CreateNoteDto } from './dtos/create-note.dto';
import { UpdateNoteDto } from './dtos/update-note.dto';
import { QueryNoteDto } from './dtos/query-note.dto';
import { NoteResponseDto } from './dtos/response/note-response.dto';
import { PaginatedResult } from '../../common/interfaces/pagination.interface';

@Injectable()
export class NotesService {
  constructor(
    private readonly createNoteUseCase: CreateNoteUseCase,
    private readonly findNotesUseCase: FindNotesUseCase,
    private readonly findNoteUseCase: FindNoteUseCase,
    private readonly updateNoteUseCase: UpdateNoteUseCase,
    private readonly deleteNoteUseCase: DeleteNoteUseCase,
  ) {}

  async create(
    dto: CreateNoteDto,
    createdById: string,
  ): Promise<NoteResponseDto> {
    const note = await this.createNoteUseCase.execute(dto, createdById);
    return NoteResponseDto.fromEntity(note);
  }

  async findAll(
    query: QueryNoteDto,
  ): Promise<PaginatedResult<NoteResponseDto>> {
    const result = await this.findNotesUseCase.execute(query);
    return NoteResponseDto.fromPaginated(result);
  }

  async findOne(id: number): Promise<NoteResponseDto> {
    const note = await this.findNoteUseCase.execute(id);
    return NoteResponseDto.fromEntity(note);
  }

  async update(id: number, dto: UpdateNoteDto): Promise<NoteResponseDto> {
    const note = await this.updateNoteUseCase.execute(id, dto);
    return NoteResponseDto.fromEntity(note);
  }

  async remove(id: number): Promise<void> {
    await this.deleteNoteUseCase.execute(id);
  }
}
