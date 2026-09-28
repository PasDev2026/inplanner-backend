import type {
  ImportRowError,
  ParseActivitiesResult,
} from '../../lib/import-activities.parser';

export class ImportPreviewRowDto {
  numeroFila: number;
  task_name: string;
  nivel: number;
  estado: number;
}

export class ImportPreviewDto {
  total: number;
  validas: number;
  ignoradas: number;
  errores: ImportRowError[];
  filas: ImportPreviewRowDto[];

  static from(
    result: ParseActivitiesResult,
    nivelesEfectivos: number[],
  ): ImportPreviewDto {
    const dto = new ImportPreviewDto();
    dto.validas = result.filas.length;
    dto.ignoradas = result.ignoradas;
    dto.errores = result.errores;
    dto.filas = result.filas.map((fila, index) => ({
      numeroFila: fila.numeroFila,
      task_name: fila.task_name,
      nivel: nivelesEfectivos[index] ?? fila.nivel,
      estado: fila.estado,
    }));
    dto.total = dto.validas + dto.ignoradas + dto.errores.length;
    return dto;
  }
}
