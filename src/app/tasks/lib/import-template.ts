import ExcelJS from 'exceljs';
import { TASK_STATUS_LABELS } from '../../reports/constants/report.constants';

export const IMPORT_SHEET_NAME = 'Actividades';
export const IMPORT_INSTRUCTIONS_SHEET_NAME = 'Instrucciones';
export const IMPORT_TEMPLATE_MAX_ROWS = 500;
export const IMPORT_TEMPLATE_MAX_BYTES = 2 * 1024 * 1024;

export const IMPORT_TEMPLATE_HEADERS = {
  name: 'Tarea',
  description: 'Descripcion',
  level: 'Nivel',
  status: 'Estado',
} as const;

const COLORS = {
  brandDark: 'FF00375A',
  brandPrimary: 'FF259D9A',
  brandLight: 'FF4DC4C1',
  zebra: 'FFF2FAFA',
  border: 'FFD9D9D9',
  white: 'FFFFFFFF',
} as const;

const STATUS_TEXT_COLORS: Record<number, string> = {
  0: 'FF6B7280',
  1: 'FFF59E0B',
  2: 'FF3B82F6',
  3: 'FFF59E0B',
  4: 'FF16A34A',
};

const STATUS_ORDER = [0, 1, 2, 3, 4];

const EXAMPLE_ROWS: [string, string, number, number][] = [
  ['Planificación del día', 'Revisar pendientes y priorizar actividades', 1, 4],
  ['Revisar correos', 'Responder mensajes pendientes', 2, 4],
  ['Reunión de equipo', 'Daily de avance de proyectos', 2, 2],
  ['Desarrollo Inplanner', 'Avances de backend y frontend', 1, 2],
  ['Endpoint de importación', 'Crear POST /tasks/import', 2, 0],
  ['Parser Excel/CSV', 'Leer la plantilla y validar columnas', 3, 1],
  ['Pruebas del parser', 'Casos: plano, anidado y vacío', 3, 0],
  ['Documentación', 'Actualizar el README del módulo', 1, 3],
];

const INSTRUCTIONS: [string, string][] = [
  [
    'Encabezados',
    'Deben ir en la fila 1 de la hoja "Actividades": Tarea, Descripcion, Nivel, Estado',
  ],
  ['Filas vacías', 'Se ignoran automáticamente'],
  [
    'Nivel',
    '1 = actividad, 2 = subtarea, 3 = sub-subtarea. Puedes anidar a más profundidad (4, 5, ...). Vacío = 1',
  ],
  ['Estado', 'Nombre o número (ver glosario). Vacío = Pendiente'],
  ['Nombres', 'El campo Tarea admite hasta 150 caracteres'],
  ['Columnas extra', 'Se ignoran'],
  ['Límites', `Máximo ${IMPORT_TEMPLATE_MAX_ROWS} filas y 2 MB`],
  [
    'Ejemplos',
    'Puedes borrar las filas de ejemplo o escribir tus actividades encima',
  ],
];

function solidFill(argb: string): ExcelJS.Fill {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb } };
}

function thinBorder(): Partial<ExcelJS.Borders> {
  const side: ExcelJS.Border = {
    style: 'thin',
    color: { argb: COLORS.border },
  };
  return { top: side, left: side, bottom: side, right: side };
}

function buildActivitiesSheet(workbook: ExcelJS.Workbook): void {
  const sheet = workbook.addWorksheet(IMPORT_SHEET_NAME);
  sheet.columns = [
    { header: IMPORT_TEMPLATE_HEADERS.name, key: 'name', width: 42 },
    {
      header: IMPORT_TEMPLATE_HEADERS.description,
      key: 'description',
      width: 55,
    },
    { header: IMPORT_TEMPLATE_HEADERS.level, key: 'level', width: 10 },
    { header: IMPORT_TEMPLATE_HEADERS.status, key: 'status', width: 14 },
  ];

  const headerRow = sheet.getRow(1);
  headerRow.height = 22;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: COLORS.white } };
    cell.fill = solidFill(COLORS.brandDark);
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = thinBorder();
  });
  sheet.views = [{ state: 'frozen', ySplit: 1 }];

  EXAMPLE_ROWS.forEach(([name, description, level, status], index) => {
    const row = sheet.addRow([
      name,
      description,
      level,
      TASK_STATUS_LABELS[status],
    ]);
    const zebra = index % 2 === 1 ? COLORS.zebra : undefined;
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = thinBorder();
      if (zebra) cell.fill = solidFill(zebra);
    });
    row.getCell(1).alignment = {
      indent: Math.max(0, level - 1),
      vertical: 'middle',
    };
    row.getCell(3).alignment = { horizontal: 'center' };
    const statusCell = row.getCell(4);
    statusCell.alignment = { horizontal: 'center' };
    statusCell.font = {
      bold: true,
      color: { argb: STATUS_TEXT_COLORS[status] ?? COLORS.brandDark },
    };
  });

  const lastRow = IMPORT_TEMPLATE_MAX_ROWS + 1;
  const statusList = STATUS_ORDER.map((s) => TASK_STATUS_LABELS[s]).join(',');
  const validations = sheet as unknown as {
    dataValidations: { add(range: string, rule: unknown): void };
  };
  validations.dataValidations.add(`C2:C${lastRow}`, {
    type: 'list',
    allowBlank: true,
    formulae: ['"1,2,3"'],
    showErrorMessage: true,
    errorTitle: 'Nivel inválido',
    error: 'Usa 1, 2 o 3',
  });
  validations.dataValidations.add(`D2:D${lastRow}`, {
    type: 'list',
    allowBlank: true,
    formulae: [`"${statusList}"`],
    showErrorMessage: true,
    errorTitle: 'Estado inválido',
    error: 'Elige uno de la lista',
  });
}

function buildInstructionsSheet(workbook: ExcelJS.Workbook): void {
  const sheet = workbook.addWorksheet(IMPORT_INSTRUCTIONS_SHEET_NAME);
  sheet.columns = [
    { header: 'Regla', key: 'rule', width: 22 },
    { header: 'Detalle', key: 'detail', width: 80 },
  ];

  const headerRow = sheet.getRow(1);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: COLORS.white } };
    cell.fill = solidFill(COLORS.brandPrimary);
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  for (const [rule, detail] of INSTRUCTIONS) {
    const row = sheet.addRow([rule, detail]);
    row.getCell(1).font = { bold: true, color: { argb: COLORS.brandDark } };
    row.alignment = { vertical: 'top', wrapText: true };
  }

  sheet.addRow([]);
  const titleRow = sheet.addRow(['Estados de la tarea', '']);
  sheet.mergeCells(`A${titleRow.number}:B${titleRow.number}`);
  titleRow.height = 20;
  titleRow.eachCell((cell) => {
    cell.fill = solidFill(COLORS.brandLight);
    cell.font = { bold: true, color: { argb: COLORS.brandDark } };
    cell.alignment = { vertical: 'middle' };
  });

  for (const status of STATUS_ORDER) {
    const row = sheet.addRow([TASK_STATUS_LABELS[status], status]);
    row.getCell(1).font = {
      bold: true,
      color: { argb: STATUS_TEXT_COLORS[status] ?? COLORS.brandDark },
    };
    row.getCell(2).alignment = { horizontal: 'center' };
  }
}

export function buildImportTemplateWorkbook(): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Inplanner';
  workbook.created = new Date();

  buildActivitiesSheet(workbook);
  buildInstructionsSheet(workbook);

  return workbook;
}

export async function buildImportTemplateBuffer(): Promise<Buffer> {
  const workbook = buildImportTemplateWorkbook();
  return (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
}
