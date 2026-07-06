import { InjectionToken } from '@nestjs/common';
import { NoteEntity } from '../entities/note.entity';
import { QueryNoteDto } from '../dtos/query-note.dto';
import { PaginatedResult } from '../../../common/interfaces/pagination.interface';

export const NOTE_REPOSITORY = 'NOTE_REPOSITORY' as InjectionToken;

export interface INoteRepository {
  save(note: NoteEntity): Promise<NoteEntity>;
  findWithPagination(query: QueryNoteDto): Promise<PaginatedResult<NoteEntity>>;
  findOneById(id: number): Promise<NoteEntity | null>;
  delete(note: NoteEntity): Promise<void>;
}
