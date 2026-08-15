import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import type { INoteRepository } from '../repository/note-repository.interface';
import { NOTE_REPOSITORY } from '../repository/note-repository.interface';
import { AttachmentsService } from '../../attachments/attachments.service';

@Injectable()
export class DeleteNoteUseCase {
  constructor(
    @Inject(NOTE_REPOSITORY)
    private readonly noteRepo: INoteRepository,
    private readonly attachmentsService: AttachmentsService,
  ) {}

  async execute(id: number): Promise<void> {
    const note = await this.noteRepo.findOneById(id);
    if (!note) {
      throw new NotFoundException('Nota con ID ' + id + ' no encontrada');
    }
    await this.attachmentsService.removeReferencedInHtml(note.content);
    await this.noteRepo.delete(note);
  }
}
