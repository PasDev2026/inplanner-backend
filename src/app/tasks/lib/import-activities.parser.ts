import ExcelJS from 'exceljs';
import { Readable } from 'node:stream';
import { VALIDATION } from '../../../common/constants/validation.constants';
import { TASK_STATUS_LABELS } from '../../reports/constants/report.constants';
import { IMPORT_SHEET_NAME, IMPORT_TEMPLATE_MAX_ROWS } from './import-template';

export const ACTIVITY_HEADER_ALIASES = {
  id: ['id', 'id tarea', 'id_tarea'],
  name: ['tarea', 'nombre'],
  description: ['descripcion', 'detalle'],
  level: ['nivel'],
  startDate: ['fecha inicio', 'inicio', 'fecha de inicio'],
  dueDate: [
    'fecha vencimiento',
    'vencimiento',
    'fecha fin',
    'fin',
    'fecha de vencimiento',
  ],
  responsible: ['responsable', 'responsables', 'asignado', 'asignados'],
  responsible2: [
    'responsable 2',
    'responsable2',
    'asignado 2',
    'asignado2',
    'responsable secundario',
  ],
  status: ['estado'],
} as const;

export interface ImportRowError {
  numeroFila: number;
  mensaje: string;
}

export interface ParsedActivityRow {
  numeroFila: number;
  /** ID de la tarea existente (columna ID del export). Vacío = tarea nueva. */
  existing_task_id?: number;
  task_name: string;
  task_description?: string;
  nivel: number;
  start_date?: string; // YYYY-MM-DD
  due_date?: string; // YYYY-MM-DD
  responsables?: string[];
  estado: number;
}

export interface ParseActivitiesResult {
  filas: ParsedActivityRow[];
  errores: ImportRowError[];
  ignoradas: number;
}

interface RawRow {
  numeroFila: number;
  data: Record<string, unknown>;
}

interface RawSheet {
  headers: string[];
  rows: RawRow[];
}

const MIN_STATUS = 0;
const MAX_STATUS = 4;
const STATUS_RULE =
  'Pendiente, En espera, En progreso, En revisión, Completado o un número del 0 al 4';

function toText(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return '';
}

function normalizeHeader(value: unknown): string {
  return toText(value)
    .replace(/^\uFEFF/, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

const STATUS_LABEL_TO_CODE = new Map<string, number>(
  Object.entries(TASK_STATUS_LABELS).map(([code, label]) => [
    normalizeHeader(label),
    Number(code),
  ]),
);

function pick(
  record: Record<string, unknown>,
  aliases: readonly string[],
): string {
  for (const key of aliases) {
    const text = toText(record[key]).trim();
    if (text !== '') return text;
  }
  return '';
}

function parseStatus(raw: string): number | null {
  const numeric = Number(raw);
  if (
    Number.isInteger(numeric) &&
    numeric >= MIN_STATUS &&
    numeric <= MAX_STATUS
  ) {
    return numeric;
  }
  return STATUS_LABEL_TO_CODE.get(normalizeHeader(raw)) ?? null;
}

const pad = (n: string): string => n.padStart(2, '0');
const EXCEL_EPOCH_UTC = Date.UTC(1899, 11, 30);

function excelSerialToIso(serial: number): string {
  return new Date(EXCEL_EPOCH_UTC + serial * 86400000)
    .toISOString()
    .slice(0, 10);
}

/**
 * Construye YYYY-MM-DD validando rangos reales (mes 1-12, día válido para el mes).
 * Devuelve null si la fecha no existe.
 */
function buildIso(year: number, month: number, day: number): string | null {
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }
  return `${year}-${pad(String(month))}-${pad(String(day))}`;
}

/**
 * Normaliza una fecha a YYYY-MM-DD. Acepta ISO (2026-09-29), DD/MM/YYYY
 * (LatAm), YYYY/MM/DD y el número serial de Excel. Devuelve null si no se
 * puede interpretar ('' también devuelve null; el llamador lo trata como vacío).
 */
function parseDate(raw: string): string | null {
  const value = raw.trim();
  if (value === '') return null;

  let m = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return buildIso(Number(m[1]), Number(m[2]), Number(m[3]));

  m = value.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
  if (m) return buildIso(Number(m[1]), Number(m[2]), Number(m[3]));

  m = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return buildIso(Number(m[3]), Number(m[2]), Number(m[1]));

  if (/^\d{4,5}(\.\d+)?$/.test(value)) {
    const serial = Number(value);
    if (serial >= 20000 && serial <= 80000) return excelSerialToIso(serial);
  }
  return null;
}

/** Divide una celda de responsables por coma/punto y coma. */
function parseResponsibles(raw: string): string[] | undefined {
  const tokens = raw
    .split(/[,;]/)
    .map((token) => token.trim())
    .filter(Boolean);
  return tokens.length > 0 ? tokens : undefined;
}

function validateRow(row: RawRow): ImportRowError | null {
  const problemas: string[] = [];
  const name = pick(row.data, ACTIVITY_HEADER_ALIASES.name);

  if (!name) {
    problemas.push('falta la columna Tarea');
  } else if (name.length > VALIDATION.TASK_NAME_MAX_LENGTH) {
    problemas.push(
      `la tarea supera los ${VALIDATION.TASK_NAME_MAX_LENGTH} caracteres`,
    );
  }

  const rawId = pick(row.data, ACTIVITY_HEADER_ALIASES.id);
  if (rawId !== '') {
    const id = Number(rawId);
    if (!Number.isInteger(id) || id <= 0) {
      problemas.push('ID inválido: usa un número entero mayor a 0');
    }
  }

  const rawLevel = pick(row.data, ACTIVITY_HEADER_ALIASES.level);
  if (rawLevel !== '') {
    const level = Number.parseInt(rawLevel, 10);
    if (!Number.isInteger(level) || level < 1) {
      problemas.push('Nivel inválido: usa un número entero mayor o igual a 1');
    }
  }

  const rawStatus = pick(row.data, ACTIVITY_HEADER_ALIASES.status);
  if (rawStatus !== '' && parseStatus(rawStatus) === null) {
    problemas.push(`Estado inválido: usa ${STATUS_RULE}`);
  }

  const rawStart = pick(row.data, ACTIVITY_HEADER_ALIASES.startDate);
  if (rawStart !== '' && parseDate(rawStart) === null) {
    problemas.push('Fecha inicio inválida: usa AAAA-MM-DD o DD/MM/AAAA');
  }

  const rawDue = pick(row.data, ACTIVITY_HEADER_ALIASES.dueDate);
  if (rawDue !== '' && parseDate(rawDue) === null) {
    problemas.push('Fecha vencimiento inválida: usa AAAA-MM-DD o DD/MM/AAAA');
  }

  if (problemas.length === 0) return null;
  return { numeroFila: row.numeroFila, mensaje: problemas.join('. ') };
}

export function parseActivityRows(rows: RawRow[]): ParseActivitiesResult {
  const filas: ParsedActivityRow[] = [];
  const errores: ImportRowError[] = [];
  let ignoradas = 0;

  for (const row of rows) {
    if (Object.keys(row.data).length === 0) {
      ignoradas++;
      continue;
    }

    const error = validateRow(row);
    if (error) {
      errores.push(error);
      continue;
    }

    const rawLevel = pick(row.data, ACTIVITY_HEADER_ALIASES.level);
    const rawStatus = pick(row.data, ACTIVITY_HEADER_ALIASES.status);
    const rawStart = pick(row.data, ACTIVITY_HEADER_ALIASES.startDate);
    const rawDue = pick(row.data, ACTIVITY_HEADER_ALIASES.dueDate);
    const rawResponsible = pick(row.data, ACTIVITY_HEADER_ALIASES.responsible);
    const rawResponsible2 = pick(
      row.data,
      ACTIVITY_HEADER_ALIASES.responsible2,
    );
    const rawId = pick(row.data, ACTIVITY_HEADER_ALIASES.id);
    const description = pick(row.data, ACTIVITY_HEADER_ALIASES.description);
    filas.push({
      numeroFila: row.numeroFila,
      existing_task_id: rawId === '' ? undefined : Number.parseInt(rawId, 10),
      task_name: pick(row.data, ACTIVITY_HEADER_ALIASES.name),
      task_description: description || undefined,
      nivel: rawLevel === '' ? 1 : Number.parseInt(rawLevel, 10),
      start_date: parseDate(rawStart) ?? undefined,
      due_date: parseDate(rawDue) ?? undefined,
      responsables: parseResponsibles(
        [rawResponsible, rawResponsible2].filter((v) => v !== '').join(', '),
      ),
      estado: rawStatus === '' ? 0 : (parseStatus(rawStatus) ?? 0),
    });
  }

  return { filas, errores, ignoradas };
}

/**
 * Resuelve la jerarquía con un stack: una fila de nivel N cuelga de la última
 * fila de nivel N-1. Los saltos de nivel se corrigen a "último nivel + 1" para
 * no dejar huérfanos. Devuelve el índice del padre de cada fila (o null) y el
 * nivel efectivo ya corregido.
 */
export function resolveHierarchy<T extends { nivel: number }>(
  rows: T[],
): { parentIndexes: (number | null)[]; nivelesEfectivos: number[] } {
  const stack: number[] = [];
  const parentIndexes: (number | null)[] = [];
  const nivelesEfectivos: number[] = [];

  rows.forEach((row, index) => {
    const level = Math.min(Math.max(1, row.nivel), stack.length + 1);
    parentIndexes.push(level > 1 ? stack[level - 2] : null);
    nivelesEfectivos.push(level);
    stack.length = level - 1;
    stack[level - 1] = index;
  });

  return { parentIndexes, nivelesEfectivos };
}

function cellText(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value.toISOString().slice(0, 10); // YYYY-MM-DD
  if (typeof value === 'object') {
    const candidate = value as {
      richText?: { text: unknown }[];
      text?: unknown;
      result?: unknown;
      hyperlink?: unknown;
    };
    if (Array.isArray(candidate.richText)) {
      return candidate.richText.map((part) => toText(part.text)).join('');
    }
    if (candidate.text !== undefined) return toText(candidate.text);
    if (candidate.result !== undefined) return toText(candidate.result);
    if (candidate.hyperlink !== undefined) return toText(candidate.hyperlink);
    return '';
  }
  return toText(value);
}

function detectDelimiter(buffer: Buffer): string {
  const firstLine = buffer.toString('utf8').split(/\r?\n/)[0] ?? '';
  const candidates = [',', ';', '\t'].map((delimiter) => ({
    delimiter,
    count: firstLine.split(delimiter).length - 1,
  }));
  candidates.sort((a, b) => b.count - a.count);
  return candidates[0].count > 0 ? candidates[0].delimiter : ',';
}

function readRawSheet(worksheet: ExcelJS.Worksheet): RawSheet {
  const rows: RawRow[] = [];
  let headers: string[] = [];

  worksheet.eachRow({ includeEmpty: false }, (row, numeroFila) => {
    if (numeroFila === 1) {
      headers = [];
      row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        headers[colNumber] = normalizeHeader(cellText(cell.value));
      });
      return;
    }

    const data: Record<string, unknown> = {};
    for (let col = 1; col < headers.length; col++) {
      const header = headers[col];
      if (!header) continue;
      const value = cellText(row.getCell(col).value).trim();
      if (value !== '') data[header] = value;
    }
    rows.push({ numeroFila, data });
  });

  return { headers, rows };
}

function hasNameHeader(headers: string[]): boolean {
  return ACTIVITY_HEADER_ALIASES.name.some((alias) => headers.includes(alias));
}

export async function parseActivitiesWorkbook(
  buffer: Buffer,
  filename: string,
): Promise<ParseActivitiesResult> {
  const workbook = new ExcelJS.Workbook();

  try {
    if (filename.toLowerCase().endsWith('.csv')) {
      await workbook.csv.read(Readable.from(buffer), {
        parserOptions: { delimiter: detectDelimiter(buffer) },
      });
    } else {
      // exceljs tipa su Buffer como ArrayBuffer; Node Buffer es válido en runtime.
      await workbook.xlsx.load(buffer as never);
    }
  } catch {
    return {
      filas: [],
      errores: [
        {
          numeroFila: 0,
          mensaje: 'No se pudo leer el archivo. Verifica que sea .xlsx o .csv',
        },
      ],
      ignoradas: 0,
    };
  }

  const worksheet =
    workbook.getWorksheet(IMPORT_SHEET_NAME) ?? workbook.worksheets[0];
  if (!worksheet) {
    return {
      filas: [],
      errores: [{ numeroFila: 0, mensaje: 'El archivo no contiene hojas' }],
      ignoradas: 0,
    };
  }

  const { headers, rows } = readRawSheet(worksheet);
  if (!hasNameHeader(headers)) {
    return {
      filas: [],
      errores: [
        {
          numeroFila: 1,
          mensaje: 'La primera fila debe tener una columna "Tarea"',
        },
      ],
      ignoradas: 0,
    };
  }

  if (rows.length > IMPORT_TEMPLATE_MAX_ROWS) {
    return {
      filas: [],
      errores: [
        {
          numeroFila: 0,
          mensaje: `El archivo supera el máximo de ${IMPORT_TEMPLATE_MAX_ROWS} filas`,
        },
      ],
      ignoradas: 0,
    };
  }

  const result = parseActivityRows(rows);
  if (result.filas.length === 0 && result.errores.length === 0) {
    return {
      filas: [],
      errores: [
        {
          numeroFila: 0,
          mensaje: 'No se encontraron actividades en el archivo',
        },
      ],
      ignoradas: result.ignoradas,
    };
  }

  return result;
}
