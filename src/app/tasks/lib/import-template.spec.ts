import ExcelJS from 'exceljs';
import {
  IMPORT_SHEET_NAME,
  IMPORT_TEMPLATE_MAX_BYTES,
  IMPORT_TEMPLATE_MAX_ROWS,
  IMPORT_USERS_SHEET_NAME,
  buildImportTemplateBuffer,
  buildProjectExportBuffer,
} from './import-template';

describe('buildImportTemplateBuffer', () => {
  it('incluye columnas de responsable, ID y la hoja oculta de usuarios', async () => {
    const names = ['Ana López', 'Pedro'];
    const buffer = await buildImportTemplateBuffer(names);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as never);

    const sheet = workbook.getWorksheet(IMPORT_SHEET_NAME);
    expect(sheet).toBeDefined();
    const headers = sheet!.getRow(1).values as unknown[];
    expect(headers).toContain('Responsable');
    expect(headers).toContain('Responsable 2');
    expect(headers).toContain('ID');

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

  it('usa límites de 1000 filas y 5 MB', () => {
    expect(IMPORT_TEMPLATE_MAX_ROWS).toBe(1000);
    expect(IMPORT_TEMPLATE_MAX_BYTES).toBe(5 * 1024 * 1024);
  });
});

describe('buildProjectExportBuffer', () => {
  it('escribe las filas del proyecto con su ID en la última columna', async () => {
    const buffer = await buildProjectExportBuffer([
      {
        id: 101,
        name: 'Tarea existente',
        description: 'detalle',
        level: 1,
        startDate: '2026-09-29',
        dueDate: '2026-10-15',
        status: 2,
        responsible: 'Ana López Ruiz',
      },
      {
        name: 'Tarea nueva',
        level: 2,
        status: 0,
      },
    ]);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as never);
    const sheet = workbook.getWorksheet(IMPORT_SHEET_NAME)!;

    expect(sheet.getCell('A2').value).toBe('Tarea existente');
    expect(sheet.getCell('I1').value).toBe('ID');
    expect(sheet.getCell('I2').value).toBe(101);
    expect(sheet.getCell('A3').value).toBe('Tarea nueva');
    expect(sheet.getCell('I3').value).toBe('');
  });
});
