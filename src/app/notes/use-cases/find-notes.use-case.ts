import { Injectable, Inject } from '@nestjs/common';
import type { INoteRepository } from '../repository/note-repository.interface';
import { NOTE_REPOSITORY } from '../repository/note-repository.interface';
import { QueryNoteDto } from '../dtos/query-note.dto';
import { PaginatedResult } from '../../../common/interfaces/pagination.interface';
import { NoteEntity } from '../entities/note.entity';

@Injectable()
export class FindNotesUseCase {
  constructor(
    @Inject(NOTE_REPOSITORY)
    private readonly noteRepo: INoteRepository,
  ) {}

  async execute(query: QueryNoteDto): Promise<PaginatedResult<NoteEntity>> {
    return this.noteRepo.findWithPagination(query);
  }
}
