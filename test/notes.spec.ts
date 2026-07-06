import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { NOTE_REPOSITORY } from '../src/app/notes/repository/note-repository.interface';
import type { INoteRepository } from '../src/app/notes/repository/note-repository.interface';
import { CreateNoteUseCase } from '../src/app/notes/use-cases/create-note.use-case';
import { FindNotesUseCase } from '../src/app/notes/use-cases/find-notes.use-case';
import { FindNoteUseCase } from '../src/app/notes/use-cases/find-note.use-case';
import { UpdateNoteUseCase } from '../src/app/notes/use-cases/update-note.use-case';
import { DeleteNoteUseCase } from '../src/app/notes/use-cases/delete-note.use-case';
import { NoteEntity } from '../src/app/notes/entities/note.entity';
import { createMock, Mockify } from './helpers/mock-factory';

describe('NotesModule', () => {
  let createUseCase: CreateNoteUseCase;
  let findNotesUseCase: FindNotesUseCase;
  let findNoteUseCase: FindNoteUseCase;
  let updateUseCase: UpdateNoteUseCase;
  let deleteUseCase: DeleteNoteUseCase;
  let repo: Mockify<INoteRepository>;

  beforeAll(async () => {
    repo = createMock<INoteRepository>([
      'save',
      'findWithPagination',
      'findOneById',
      'delete',
    ]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: NOTE_REPOSITORY, useValue: repo },
        CreateNoteUseCase,
        FindNotesUseCase,
        FindNoteUseCase,
        UpdateNoteUseCase,
        DeleteNoteUseCase,
      ],
    }).compile();

    createUseCase = module.get(CreateNoteUseCase);
    findNotesUseCase = module.get(FindNotesUseCase);
    findNoteUseCase = module.get(FindNoteUseCase);
    updateUseCase = module.get(UpdateNoteUseCase);
    deleteUseCase = module.get(DeleteNoteUseCase);
  });

  beforeEach(() => {
    jest.resetAllMocks();
  });

  describe('create', () => {
    it('should create a note with createdById', async () => {
      const dto = { content: 'Test note', task_id: 1 };
      const saved = new NoteEntity();
      saved.id_note = 1;
      saved.content = 'Test note';
      saved.created_by_id = 42;
      repo.save.mockResolvedValue(saved);

      const result = await createUseCase.execute(dto, 42);

      expect(repo.save).toHaveBeenCalledWith(
        expect.objectContaining({ content: 'Test note', created_by_id: 42 }),
      );
      expect(result).toEqual(saved);
    });
  });

  describe('findAll', () => {
    it('should return paginated notes', async () => {
      const query = { page: 1, limit: 20 };
      const expected = {
        data: [new NoteEntity()],
        meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
      };
      repo.findWithPagination.mockResolvedValue(expected);

      const result = await findNotesUseCase.execute(query);

      expect(repo.findWithPagination).toHaveBeenCalledWith(query);
      expect(result).toEqual(expected);
    });
  });

  describe('findOne', () => {
    it('should return a note when found', async () => {
      const note = new NoteEntity();
      note.id_note = 1;
      repo.findOneById.mockResolvedValue(note);

      const result = await findNoteUseCase.execute(1);

      expect(result).toEqual(note);
    });

    it('should throw NotFoundException when not found', async () => {
      repo.findOneById.mockResolvedValue(null);

      await expect(findNoteUseCase.execute(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update and return the note', async () => {
      const existing = new NoteEntity();
      existing.id_note = 1;
      existing.content = 'Old content';
      repo.findOneById.mockResolvedValue(existing);
      repo.save.mockResolvedValue({ ...existing, content: 'New content' });

      const result = await updateUseCase.execute(1, {
        content: 'New content',
      });

      expect(repo.save).toHaveBeenCalled();
      expect(result.content).toBe('New content');
    });

    it('should throw NotFoundException when not found', async () => {
      repo.findOneById.mockResolvedValue(null);

      await expect(
        updateUseCase.execute(999, { content: 'x' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete an existing note', async () => {
      const note = new NoteEntity();
      note.id_note = 1;
      repo.findOneById.mockResolvedValue(note);

      await deleteUseCase.execute(1);

      expect(repo.delete).toHaveBeenCalledWith(note);
    });

    it('should throw NotFoundException when not found', async () => {
      repo.findOneById.mockResolvedValue(null);

      await expect(deleteUseCase.execute(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
