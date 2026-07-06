import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { INoteRepository } from '../repository/note-repository.interface';
import { NOTE_REPOSITORY } from '../repository/note-repository.interface';
import { NoteEntity } from '../entities/note.entity';
import { UpdateNoteDto } from '../dtos/update-note.dto';

@Injectable()
export class UpdateNoteUseCase {
  constructor(
    @Inject(NOTE_REPOSITORY)
    private readonly noteRepo: INoteRepository,
  ) {}

  async execute(id: number, dto: UpdateNoteDto): Promise<NoteEntity> {
    const note = await this.noteRepo.findOneById(id);
    if (!note) {
      throw new NotFoundException('Nota con ID ' + id + ' no encontrada');
    }
    Object.assign(note, dto);
    return this.noteRepo.save(note);
  }
}
