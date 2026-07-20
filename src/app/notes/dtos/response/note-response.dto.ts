import { NoteEntity } from '../../entities/note.entity';
import { PaginatedResult } from '../../../../common/interfaces/pagination.interface';

export class NoteResponseDto {
  id_note: number;
  content: string;
  task_id: number;
  created_by_id: string;
  created_at: Date;
  updated_at: Date;
  author_name?: string;

  static fromEntity(entity: NoteEntity): NoteResponseDto {
    const dto = new NoteResponseDto();
    dto.id_note = entity.id_note;
    dto.content = entity.content;
    dto.task_id = entity.task_id;
    dto.created_by_id = entity.created_by_id;
    dto.created_at = entity.created_at;
    dto.updated_at = entity.updated_at;
    dto.author_name = entity.createdBy?.name;
    return dto;
  }

  static fromEntityList(entities: NoteEntity[]): NoteResponseDto[] {
    return entities.map((e) => NoteResponseDto.fromEntity(e));
  }

  static fromPaginated(
    result: PaginatedResult<NoteEntity>,
  ): PaginatedResult<NoteResponseDto> {
    return {
      data: NoteResponseDto.fromEntityList(result.data),
      meta: result.meta,
    };
  }
}
