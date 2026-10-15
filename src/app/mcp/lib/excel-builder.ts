import ExcelJS from 'exceljs';

/** Columna de una hoja de exportación. */
export interface ExcelColumn {
  key: string;
  header: string;
  /** Ancho fijo de la columna; si se omite se calcula automáticamente. */
  width?: number;
}

export type ExcelRow = Record<string, unknown>;

/**
 * Construye un workbook de una sola hoja a partir de columnas y filas.
 * Los encabezados van en negrita y el ancho se autoajusta.
 */
export async function buildWorkbook(
  sheetName: string,
  columns: ExcelColumn[],
  rows: ExcelRow[],
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet(sheetName);

  sheet.addRow(columns.map((column) => column.header));
  sheet.getRow(1).font = { bold: true };

  for (const row of rows) {
    sheet.addRow(columns.map((column) => row[column.key] ?? ''));
  }

  columns.forEach((column, index) => {
    const sheetColumn = sheet.getColumn(index + 1);
    if (column.width) {
      sheetColumn.width = column.width;
      return;
    }
    const maxLength = Math.max(
      0,
      ...sheetColumn.values.map((value) => {
        if (typeof value === 'string') return value.length;
        if (typeof value === 'number') return String(value).length;
        return 0;
      }),
    );
    sheetColumn.width = Math.min(Math.max(maxLength + 2, 10), 50);
  });

  return workbook.xlsx.writeBuffer() as unknown as Promise<Buffer>;
}
