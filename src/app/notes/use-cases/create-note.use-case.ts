import { Injectable, Inject } from '@nestjs/common';
import type { INoteRepository } from '../repository/note-repository.interface';
import { NOTE_REPOSITORY } from '../repository/note-repository.interface';
import { NoteEntity } from '../entities/note.entity';
import { CreateNoteDto } from '../dtos/create-note.dto';

@Injectable()
export class CreateNoteUseCase {
  constructor(
    @Inject(NOTE_REPOSITORY)
    private readonly noteRepo: INoteRepository,
  ) {}

  async execute(dto: CreateNoteDto, createdById: string): Promise<NoteEntity> {
    const note = new NoteEntity();
    Object.assign(note, dto, { created_by_id: createdById });
    return this.noteRepo.save(note);
  }
}
