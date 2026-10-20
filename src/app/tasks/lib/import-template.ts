import ExcelJS from 'exceljs';
import { TASK_STATUS_LABELS } from '../../reports/constants/report.constants';

export const IMPORT_SHEET_NAME = 'Actividades';
export const IMPORT_INSTRUCTIONS_SHEET_NAME = 'Instrucciones';
export const IMPORT_USERS_SHEET_NAME = 'Usuarios';
export const IMPORT_TEMPLATE_MAX_ROWS = 1000;
export const IMPORT_TEMPLATE_MAX_BYTES = 5 * 1024 * 1024;

export const IMPORT_TEMPLATE_HEADERS = {
  name: 'Tarea',
  description: 'Descripcion',
  level: 'Nivel',
  startDate: 'Fecha inicio',
  dueDate: 'Fecha vencimiento',
  status: 'Estado',
  responsible: 'Responsable',
  responsible2: 'Responsable 2',
  id: 'ID',
} as const;

export interface ImportTemplateRow {
  /** ID de la tarea existente. Vacío/undefined = tarea nueva. */
  id?: number;
  name: string;
  description?: string;
  level: number;
  startDate?: string;
  dueDate?: string;
  status: number;
  responsible?: string;
  responsible2?: string;
}

const SAMPLE_ROWS: ImportTemplateRow[] = [
  {
    name: 'Planificación del día',
    description: 'Revisar pendientes y priorizar actividades',
    level: 1,
    startDate: '2026-09-29',
    dueDate: '2026-09-29',
    status: 4,
  },
  {
    name: 'Revisar correos',
    description: 'Responder mensajes pendientes',
    level: 2,
    startDate: '2026-09-29',
    dueDate: '2026-09-29',
    status: 4,
  },
  {
    name: 'Reunión de equipo',
    description: 'Daily de avance de proyectos',
    level: 2,
    startDate: '2026-09-29',
    dueDate: '2026-09-29',
    status: 2,
  },
  {
    name: 'Desarrollo Inplanner',
    description: 'Avances de backend y frontend',
    level: 1,
    startDate: '2026-09-29',
    dueDate: '2026-10-15',
    status: 2,
  },
  {
    name: 'Endpoint de importación',
    description: 'Crear POST /tasks/import',
    level: 2,
    startDate: '2026-09-30',
    dueDate: '2026-10-10',
    status: 0,
  },
  {
    name: 'Parser Excel/CSV',
    description: 'Leer la plantilla y validar columnas',
    level: 3,
    startDate: '2026-09-30',
    dueDate: '2026-10-05',
    status: 1,
  },
  {
    name: 'Pruebas del parser',
    description: 'Casos: plano, anidado y vacío',
    level: 3,
    startDate: '2026-09-30',
    dueDate: '2026-10-03',
    status: 0,
  },
  {
    name: 'Documentación',
    description: 'Actualizar el README del módulo',
    level: 1,
    startDate: '2026-10-01',
    dueDate: '2026-10-08',
    status: 3,
  },
];

const INSTRUCTIONS: [string, string][] = [
  [
    'Encabezados',
    'Deben ir en la fila 1 de la hoja "Actividades": Tarea, Descripcion, Nivel, Fecha inicio, Fecha vencimiento, Estado, Responsable, Responsable 2, ID',
  ],
  ['Filas vacías', 'Se ignoran automáticamente'],
  [
    'Nivel',
    '1 = actividad, 2 = subtarea, 3 = sub-subtarea. Puedes anidar a más profundidad (4, 5, ...). Vacío = 1',
  ],
  [
    'Fecha inicio',
    'Formato AAAA-MM-DD (ej. 2026-09-29). También acepta DD/MM/AAAA. Vacío = hoy al crear',
  ],
  [
    'Fecha vencimiento',
    'Formato AAAA-MM-DD (ej. 2026-10-15). También acepta DD/MM/AAAA. Opcional',
  ],
  ['Estado', 'Nombre o número (ver glosario). Vacío = Pendiente'],
  [
    'Responsable / Responsable 2',
    'Elige de la lista (nombre y apellidos). Debe existir en el sistema. Vacío = se asigna a quien importa',
  ],
  ['Nombres', 'El campo Tarea admite hasta 150 caracteres'],
  ['Columnas extra', 'Se ignoran'],
  [
    'Columna ID',
    'Las filas exportadas desde un proyecto traen el ID de la tarea. Déjalo vacío para crear una tarea nueva y no copies el ID en filas nuevas. No borres esta columna: es lo que permite actualizar u omitir sin duplicar.',
  ],
  [
    'Filas existentes',
    'Si la fila no cambió se omite. Si cambió algún dato (tarea, descripción, fechas, estado, nivel o responsables) se actualiza.',
  ],
  [
    'Celdas vacías',
    'En una fila existente, una celda vacía significa "sin cambio": no borra fechas ni responsables.',
  ],
  ['Límites', `Máximo ${IMPORT_TEMPLATE_MAX_ROWS} filas y 5 MB`],
  [
    'Ejemplos',
    'La plantilla descargable incluye filas de ejemplo; el export de un proyecto trae sus tareas reales. Puedes borrar las filas de ejemplo o escribir encima',
  ],
];

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

function buildUsersSheet(
  workbook: ExcelJS.Workbook,
  responsibleNames: string[],
): void {
  const sheet = workbook.addWorksheet(IMPORT_USERS_SHEET_NAME);
  sheet.addRow(['Responsables']);
  for (const name of responsibleNames) {
    sheet.addRow([name]);
  }
  sheet.getColumn(1).width = 40;
  // Oculta (no "veryHidden"): Excel no admite validaciones hacia hojas muy ocultas.
  sheet.state = 'hidden';
}

/**
 * Escribe la hoja de actividades con el formato exacto que consume el parser.
 * La usan tanto la plantilla vacía como el export de un proyecto.
 */
export function writeActivitiesSheet(
  workbook: ExcelJS.Workbook,
  rows: ImportTemplateRow[],
  responsibleNames: string[],
): void {
  const sheet = workbook.addWorksheet(IMPORT_SHEET_NAME);
  sheet.columns = [
    { header: IMPORT_TEMPLATE_HEADERS.name, key: 'name', width: 42 },
    {
      header: IMPORT_TEMPLATE_HEADERS.description,
      key: 'description',
      width: 55,
    },
    { header: IMPORT_TEMPLATE_HEADERS.level, key: 'level', width: 10 },
    { header: IMPORT_TEMPLATE_HEADERS.startDate, key: 'startDate', width: 16 },
    { header: IMPORT_TEMPLATE_HEADERS.dueDate, key: 'dueDate', width: 18 },
    { header: IMPORT_TEMPLATE_HEADERS.status, key: 'status', width: 14 },
    {
      header: IMPORT_TEMPLATE_HEADERS.responsible,
      key: 'responsible',
      width: 32,
    },
    {
      header: IMPORT_TEMPLATE_HEADERS.responsible2,
      key: 'responsible2',
      width: 32,
    },
    { header: IMPORT_TEMPLATE_HEADERS.id, key: 'id', width: 10 },
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

  rows.forEach((data, index) => {
    const row = sheet.addRow([
      data.name,
      data.description ?? '',
      data.level,
      data.startDate ?? '',
      data.dueDate ?? '',
      TASK_STATUS_LABELS[data.status] ?? String(data.status),
      data.responsible ?? '',
      data.responsible2 ?? '',
      data.id ?? '',
    ]);
    const zebra = index % 2 === 1 ? COLORS.zebra : undefined;
    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.border = thinBorder();
      if (zebra) cell.fill = solidFill(zebra);
    });
    row.getCell(1).alignment = {
      indent: Math.max(0, data.level - 1),
      vertical: 'middle',
    };
    row.getCell(3).alignment = { horizontal: 'center' };
    row.getCell(4).alignment = { horizontal: 'center' };
    row.getCell(5).alignment = { horizontal: 'center' };
    row.getCell(9).alignment = { horizontal: 'center' };
    const statusCell = row.getCell(6);
    statusCell.alignment = { horizontal: 'center' };
    statusCell.font = {
      bold: true,
      color: { argb: STATUS_TEXT_COLORS[data.status] ?? COLORS.brandDark },
    };
  });

  const lastRow = IMPORT_TEMPLATE_MAX_ROWS + 1;
  const statusList = STATUS_ORDER.map((s) => TASK_STATUS_LABELS[s]).join(',');
  const validations = sheet as unknown as {
    dataValidations: { add(range: string, rule: unknown): void };
  };
  // Nivel: entero >= 1. Se usa validación numérica (no lista) para permitir
  // profundidades mayores a 3, que también puede generar el export.
  validations.dataValidations.add(`C2:C${lastRow}`, {
    type: 'whole',
    operator: 'greaterThanOrEqual',
    allowBlank: true,
    formulae: [1],
    showErrorMessage: true,
    errorTitle: 'Nivel inválido',
    error: 'Usa un número entero mayor o igual a 1',
  });
  validations.dataValidations.add(`F2:F${lastRow}`, {
    type: 'list',
    allowBlank: true,
    formulae: [`"${statusList}"`],
    showErrorMessage: true,
    errorTitle: 'Estado inválido',
    error: 'Elige uno de la lista',
  });

  if (responsibleNames.length > 0) {
    const lastUserRow = responsibleNames.length + 1;
    const listRange = `${IMPORT_USERS_SHEET_NAME}!$A$2:$A$${lastUserRow}`;
    const responsibleRule = {
      type: 'list',
      allowBlank: true,
      formulae: [listRange],
      showErrorMessage: true,
      errorTitle: 'Responsable inválido',
      error: 'Elige un responsable de la lista',
    };
    validations.dataValidations.add(`G2:G${lastRow}`, responsibleRule);
    validations.dataValidations.add(`H2:H${lastRow}`, responsibleRule);
  }
}

function buildInstructionsSheet(workbook: ExcelJS.Workbook): void {
  const sheet = workbook.addWorksheet(IMPORT_INSTRUCTIONS_SHEET_NAME);
  sheet.columns = [
    { header: 'Regla', key: 'rule', width: 22 },
    { header: 'Detalle', key: 'detail', width: 90 },
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

export function buildImportTemplateWorkbook(
  responsibleNames: string[] = [],
): ExcelJS.Workbook {
  return buildWorkbook(SAMPLE_ROWS, responsibleNames);
}

/** Workbook de export: mismas hojas y formato, pero con las tareas del proyecto. */
export function buildProjectExportWorkbook(
  rows: ImportTemplateRow[],
  responsibleNames: string[] = [],
): ExcelJS.Workbook {
  return buildWorkbook(rows, responsibleNames);
}

function buildWorkbook(
  rows: ImportTemplateRow[],
  responsibleNames: string[],
): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Inplanner';
  workbook.created = new Date();

  writeActivitiesSheet(workbook, rows, responsibleNames);
  buildInstructionsSheet(workbook);
  if (responsibleNames.length > 0) {
    buildUsersSheet(workbook, responsibleNames);
  }

  return workbook;
}

export async function buildImportTemplateBuffer(
  responsibleNames: string[] = [],
): Promise<Buffer> {
  const workbook = buildImportTemplateWorkbook(responsibleNames);
  return (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
}

export async function buildProjectExportBuffer(
  rows: ImportTemplateRow[],
  responsibleNames: string[] = [],
): Promise<Buffer> {
  const workbook = buildProjectExportWorkbook(rows, responsibleNames);
  return (await workbook.xlsx.writeBuffer()) as unknown as Buffer;
}
