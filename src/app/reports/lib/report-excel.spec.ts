import ExcelJS from 'exceljs';
import {
  ACTIVITY_HEADERS,
  PRIORITY_LABELS,
  TASK_STATUS_LABELS,
} from '../constants/report.constants';
import { buildActivitiesWorkbook } from './report-excel';
import { toActivityExcelRow } from './report-labels';

describe('report-excel', () => {
  it('builds an activities workbook with headers and rows', async () => {
    const row = toActivityExcelRow({
      id_task: 1,
      task_name: 'Tarea demo',
      task_description: 'Desc',
      status: 2,
      priority: 3,
      start_date: new Date('2026-01-05T10:00:00Z'),
      due_date: new Date('2026-01-10T10:00:00Z'),
      created_at: new Date('2026-01-01T10:00:00Z'),
      updated_at: new Date('2026-01-01T10:00:00Z'),
      parent_task_id: null,
      id_project: 9,
      project_name: 'Proyecto A',
      project_status: 1,
      project_due_date: null,
      sede_id: null,
      manager_id: null,
      assignments: [{ user_id: 'u1', name: 'Ana', apellido_paterno: 'Pérez' }],
    });

    const buffer = await buildActivitiesWorkbook([row]);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer as never);
    const ws = wb.getWorksheet('Actividades')!;

    expect(ws.getRow(1).getCell(1).value).toBe('Nombre de tarea');
    expect(ws.getRow(2).getCell(1).value).toBe('Tarea demo');
    expect(ws.getRow(2).getCell(2).value).toBe('Ana Pérez');
    expect(ws.getRow(2).getCell(3).value).toBe(TASK_STATUS_LABELS[2]);
    expect(ws.getRow(2).getCell(4).value).toBe(PRIORITY_LABELS[3]);
    expect(ws.getRow(2).getCell(6).value).toBe('2026-01-10');
    expect(ws.getRow(2).getCell(7).value).toBe('Proyecto A');
    expect(ws.getRow(2).getCell(8).value).toBe('Activo');
    expect(ws.getColumn(1).width).toBeGreaterThanOrEqual(10);
    expect(ws.getColumn(2).width).toBeGreaterThanOrEqual(10);
  });

  it('handles empty rows gracefully', async () => {
    const buffer = await buildActivitiesWorkbook([]);
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(buffer as never);
    expect(wb.getWorksheet('Actividades')!.actualRowCount).toBe(1);
    expect(ACTIVITY_HEADERS.length).toBeGreaterThan(0);
  });

  it('prefixes task name with the hierarchy path', async () => {
    const row = toActivityExcelRow(
      {
        id_task: 2,
        task_name: 'Sub',
        task_description: null,
        status: 0,
        priority: 1,
        start_date: null,
        due_date: null,
        created_at: new Date('2026-01-01T10:00:00Z'),
        updated_at: new Date('2026-01-01T10:00:00Z'),
        parent_task_id: 1,
        id_project: 9,
        project_name: 'Proyecto A',
        project_status: 1,
        project_due_date: null,
        sede_id: null,
        manager_id: null,
        assignments: null,
      },
      { path: '1.1', level: 2 },
    );
    expect(row.task_name).toBe('   ' + '1.1. Sub');
  });
});
