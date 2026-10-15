import ExcelJS from 'exceljs';
import { buildWorkbook } from './excel-builder';

describe('buildWorkbook', () => {
  it('genera un xlsx con encabezados y filas', async () => {
    const buffer = await buildWorkbook(
      'Hoja',
      [
        { key: 'a', header: 'A' },
        { key: 'b', header: 'B' },
      ],
      [
        { a: 1, b: 'x' },
        { a: 2, b: 'y' },
      ],
    );

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as never);
    const sheet = workbook.getWorksheet('Hoja');

    expect(sheet).toBeDefined();
    expect(sheet?.getRow(1).getCell(1).value).toBe('A');
    expect(sheet?.getRow(1).getCell(2).value).toBe('B');
    expect(sheet?.getRow(2).getCell(1).value).toBe(1);
    expect(sheet?.getRow(3).getCell(2).value).toBe('y');
  });

  it('usa cadena vacía para valores nulos/indefinidos', async () => {
    const buffer = await buildWorkbook(
      'Hoja',
      [{ key: 'a', header: 'A' }],
      [{ a: null }],
    );

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as never);
    const sheet = workbook.getWorksheet('Hoja');

    expect(sheet?.getRow(2).getCell(1).value).toBe('');
  });
});
