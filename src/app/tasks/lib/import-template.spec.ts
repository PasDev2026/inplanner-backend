import ExcelJS from 'exceljs';
import {
  IMPORT_SHEET_NAME,
  IMPORT_USERS_SHEET_NAME,
  buildImportTemplateBuffer,
} from './import-template';

describe('buildImportTemplateBuffer', () => {
  it('incluye columnas de responsable y la hoja oculta de usuarios', async () => {
    const names = ['Ana López', 'Pedro'];
    const buffer = await buildImportTemplateBuffer(names);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as never);

    const sheet = workbook.getWorksheet(IMPORT_SHEET_NAME);
    expect(sheet).toBeDefined();
    const headers = sheet!.getRow(1).values as unknown[];
    expect(headers).toContain('Responsable');
    expect(headers).toContain('Responsable 2');

    const users = workbook.getWorksheet(IMPORT_USERS_SHEET_NAME);
    expect(users).toBeDefined();
    expect(users!.state).toBe('hidden');
    expect(users!.getCell('A2').value).toBe('Ana López');
  });

  it('omite la hoja de usuarios cuando no hay responsables', async () => {
    const buffer = await buildImportTemplateBuffer([]);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as never);

    expect(workbook.getWorksheet(IMPORT_USERS_SHEET_NAME)).toBeUndefined();
  });
});
