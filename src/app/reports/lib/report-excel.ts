import ExcelJS from 'exceljs';
import { ACTIVITY_HEADERS, HEADER_LABELS } from '../constants/report.constants';
import type { ActivityExcelRow } from '../interfaces/report.interface';

function buildWorksheet<R extends object>(
  wb: ExcelJS.Workbook,
  name: string,
  headers: (keyof R)[],
  rows: R[],
): void {
  const ws = wb.addWorksheet(name);
  ws.addRow(headers.map((h) => HEADER_LABELS[String(h)] ?? String(h)));
  ws.getRow(1).font = { bold: true };
  for (const row of rows) {
    ws.addRow(headers.map((h) => row[h]));
  }
  ws.columns.forEach((col, i) => {
    const maxLen = Math.max(
      0,
      ...ws
        .getColumn(i + 1)
        .values.filter(Boolean)
        .map((v) => String(v).length),
    );
    col.width = Math.min(Math.max(maxLen + 2, 10), 50);
  });
}

export function buildActivitiesWorkbook(
  rows: ActivityExcelRow[],
  sheetName = 'Actividades',
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  buildWorksheet(wb, sheetName, ACTIVITY_HEADERS, rows);
  return wb.xlsx.writeBuffer() as unknown as Promise<Buffer>;
}
