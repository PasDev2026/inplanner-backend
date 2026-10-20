import type { TaskEntity } from '../../entities/task.entity';
import { TaskResponseDto } from './task-response.dto';

export interface ImportResultSource {
  creadas: number;
  actualizadas: number;
  omitidas: number;
  tareas: TaskEntity[];
}

export class ImportResultDto {
  creadas: number;
  actualizadas: number;
  omitidas: number;
  tareas: TaskResponseDto[];

  static from(source: ImportResultSource): ImportResultDto {
    const dto = new ImportResultDto();
    dto.creadas = source.creadas;
    dto.actualizadas = source.actualizadas;
    dto.omitidas = source.omitidas;
    dto.tareas = TaskResponseDto.fromEntityList(source.tareas);
    return dto;
  }
}
