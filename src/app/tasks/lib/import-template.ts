import ExcelJS from 'exceljs';
import { TASK_STATUS_LABELS } from '../../reports/constants/report.constants';

export const IMPORT_SHEET_NAME = 'Actividades';
export const IMPORT_INSTRUCTIONS_SHEET_NAME = 'Instrucciones';
export const IMPORT_USERS_SHEET_NAME = 'Usuarios';
export const IMPORT_TEMPLATE_MAX_ROWS = 500;
export const IMPORT_TEMPLATE_MAX_BYTES = 2 * 1024 * 1024;

export const IMPORT_TEMPLATE_HEADERS = {
  name: 'Tarea',
  description: 'Descripcion',
  level: 'Nivel',
  startDate: 'Fecha inicio',
  dueDate: 'Fecha vencimiento',
  status: 'Estado',
  responsible: 'Responsable',
  responsible2: 'Responsable 2',
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

type ExampleRow = [
  string,
  string,
  number,
  string,
  string,
  number,
  string,
  string,
];

const EXAMPLE_ROWS: ExampleRow[] = [
  [
    'Planificación del día',
    'Revisar pendientes y priorizar actividades',
    1,
    '2026-09-29',
    '2026-09-29',
    4,
    '',
    '',
  ],
  [
    'Revisar correos',
    'Responder mensajes pendientes',
    2,
    '2026-09-29',
    '2026-09-29',
    4,
    '',
    '',
  ],
  [
    'Reunión de equipo',
    'Daily de avance de proyectos',
    2,
    '2026-09-29',
    '2026-09-29',
    2,
    '',
    '',
  ],
  [
    'Desarrollo Inplanner',
    'Avances de backend y frontend',
    1,
    '2026-09-29',
    '2026-10-15',
    2,
    '',
    '',
  ],
  [
    'Endpoint de importación',
    'Crear POST /tasks/import',
    2,
    '2026-09-30',
    '2026-10-10',
    0,
    '',
    '',
  ],
  [
    'Parser Excel/CSV',
    'Leer la plantilla y validar columnas',
    3,
    '2026-09-30',
    '2026-10-05',
    1,
    '',
    '',
  ],
  [
    'Pruebas del parser',
    'Casos: plano, anidado y vacío',
    3,
    '2026-09-30',
    '2026-10-03',
    0,
    '',
    '',
  ],
  [
    'Documentación',
    'Actualizar el README del módulo',
    1,
    '2026-10-01',
    '2026-10-08',
    3,
    '',
    '',
  ],
];

const INSTRUCTIONS: [string, string][] = [
  [
    'Encabezados',
    'Deben ir en la fila 1 de la hoja "Actividades": Tarea, Descripcion, Nivel, Fecha inicio, Fecha vencimiento, Estado, Responsable, Responsable 2',
  ],
  ['Filas vacías', 'Se ignoran automáticamente'],
  [
    'Nivel',
    '1 = actividad, 2 = subtarea, 3 = sub-subtarea. Puedes anidar a más profundidad (4, 5, ...). Vacío = 1',
  ],
  [
    'Fecha inicio',
    'Formato AAAA-MM-DD (ej. 2026-09-29). También acepta DD/MM/AAAA. Vacío = hoy',
  ],
  [
    'Fecha vencimiento',
    'Formato AAAA-MM-DD (ej. 2026-10-15). También acepta DD/MM/AAAA. Opcional',
  ],
  ['Estado', 'Nombre o número (ver glosario). Vacío = Pendiente'],
  [
    'Responsable / Responsable 2',
    'Elige de la lista (nombre y apellido). Debe existir en el sistema. Vacío = se asigna a quien importa',
  ],
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

function buildUsersSheet(
  workbook: ExcelJS.Workbook,
  responsibleNames: string[],
): void {
  const sheet = workbook.addWorksheet(IMPORT_USERS_SHEET_NAME);
  sheet.addRow(['Responsables']);
  for (const name of responsibleNames) {
    sheet.addRow([name]);
  }
  sheet.getColumn(1).width = 32;
  // Oculta (no "veryHidden"): Excel no admite validaciones hacia hojas muy ocultas.
  sheet.state = 'hidden';
}

function buildActivitiesSheet(
  workbook: ExcelJS.Workbook,
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
      width: 28,
    },
    {
      header: IMPORT_TEMPLATE_HEADERS.responsible2,
      key: 'responsible2',
      width: 28,
    },
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

  EXAMPLE_ROWS.forEach(
    (
      [
        name,
        description,
        level,
        startDate,
        dueDate,
        status,
        responsible,
        responsible2,
      ],
      index,
    ) => {
      const row = sheet.addRow([
        name,
        description,
        level,
        startDate,
        dueDate,
        TASK_STATUS_LABELS[status],
        responsible,
        responsible2,
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
      row.getCell(4).alignment = { horizontal: 'center' };
      row.getCell(5).alignment = { horizontal: 'center' };
      const statusCell = row.getCell(6);
      statusCell.alignment = { horizontal: 'center' };
      statusCell.font = {
        bold: true,
        color: { argb: STATUS_TEXT_COLORS[status] ?? COLORS.brandDark },
      };
    },
  );

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

export function buildImportTemplateWorkbook(
  responsibleNames: string[] = [],
): ExcelJS.Workbook {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Inplanner';
  workbook.created = new Date();

  buildActivitiesSheet(workbook, responsibleNames);
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
