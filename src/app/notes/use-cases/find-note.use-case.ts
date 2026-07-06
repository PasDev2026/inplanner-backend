import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { INoteRepository } from '../repository/note-repository.interface';
import { NOTE_REPOSITORY } from '../repository/note-repository.interface';
import { NoteEntity } from '../entities/note.entity';

@Injectable()
export class FindNoteUseCase {
  constructor(
    @Inject(NOTE_REPOSITORY)
    private readonly noteRepo: INoteRepository,
  ) {}

  async execute(id: number): Promise<NoteEntity> {
    const note = await this.noteRepo.findOneById(id);
    if (!note) {
      throw new NotFoundException('Nota con ID ' + id + ' no encontrada');
    }
    return note;
  }
}
