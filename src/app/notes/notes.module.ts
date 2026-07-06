import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NoteEntity } from './entities/note.entity';
import { NOTE_REPOSITORY } from './repository/note-repository.interface';
import { NoteTypeormRepository } from './persistence/note.typeorm.repository';
import { CreateNoteUseCase } from './use-cases/create-note.use-case';
import { FindNotesUseCase } from './use-cases/find-notes.use-case';
import { FindNoteUseCase } from './use-cases/find-note.use-case';
import { UpdateNoteUseCase } from './use-cases/update-note.use-case';
import { DeleteNoteUseCase } from './use-cases/delete-note.use-case';
import { NotesController } from './notes.controller';
import { NotesService } from './notes.service';

@Module({
  imports: [TypeOrmModule.forFeature([NoteEntity])],
  controllers: [NotesController],
  providers: [
    { provide: NOTE_REPOSITORY, useClass: NoteTypeormRepository },
    CreateNoteUseCase,
    FindNotesUseCase,
    FindNoteUseCase,
    UpdateNoteUseCase,
    DeleteNoteUseCase,
    NotesService,
  ],
  exports: [TypeOrmModule],
})
export class NotesModule {}
