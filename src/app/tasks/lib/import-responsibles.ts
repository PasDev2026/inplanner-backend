/**
 * Resolución de responsables de importación: convierte los nombres escritos en
 * el Excel (ej. "Juan Pérez, Ana López") a UUIDs de usuarios existentes, y
 * genera la lista de nombres válidos para el desplegable de la plantilla.
 *
 * Lógica pura (sin BD) para poder testearla aisladamente.
 */

export interface ResponsibleUser {
  id_user: string;
  name: string;
  apellido_paterno?: string | null;
  apellido_materno?: string | null;
}

export interface ResponsibleResolver {
  /** Resuelve una celda (uno o varios nombres separados por coma/punto y coma). */
  resolve(raw: string): { ids: string[]; errors: string[] };
}

const MAX_SUGGESTIONS = 3;

/**
 * Normaliza un nombre: quita BOM, acentos, pasa a minúsculas, colapsa espacios.
 */
export function normalizePersonName(value: string): string {
  return String(value ?? '')
    .replace(/^\uFEFF/, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');
}

/** Nombre visible de un usuario: "Nombre ApellidoPaterno". */
function displayName(user: ResponsibleUser): string {
  return `${user.name ?? ''} ${user.apellido_paterno ?? ''}`.trim();
}

/** Claves de búsqueda válidas para un usuario (nombre + apellidos). */
function nameKeys(user: ResponsibleUser): string[] {
  const name = normalizePersonName(user.name ?? '');
  const paterno = normalizePersonName(user.apellido_paterno ?? '');
  const materno = normalizePersonName(user.apellido_materno ?? '');
  const keys: string[] = [];

  if (name && paterno) keys.push(`${name} ${paterno}`);
  if (name && paterno && materno) keys.push(`${name} ${paterno} ${materno}`);
  if (name && !paterno) keys.push(name);

  return keys;
}

/** Distancia de Levenshtein (para sugerencias). */
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i++) {
    const current = [i];
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(
        previous[j] + 1,
        current[j - 1] + 1,
        previous[j - 1] + cost,
      );
    }
    previous = current;
  }
  return previous[b.length];
}

/**
 * Lista de nombres válidos para el desplegable: "Nombre ApellidoPaterno",
 * sin duplicados y excluyendo los que sean ambiguos (mismo nombre para más de
 * un usuario). Ordenada alfabéticamente.
 */
export function listResponsibleNames(users: ResponsibleUser[]): string[] {
  const counts = new Map<string, number>();
  const display = new Map<string, string>();

  for (const user of users) {
    const key = normalizePersonName(displayName(user));
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
    if (!display.has(key)) display.set(key, displayName(user));
  }

  return [...display.entries()]
    .filter(([key]) => counts.get(key) === 1)
    .map(([, name]) => name)
    .sort((a, b) => a.localeCompare(b, 'es'));
}

/**
 * Construye un resolver a partir de la lista de usuarios. Si una misma clave
 * apunta a más de un usuario, se considera ambigua. Los errores de "no
 * encontrado" incluyen hasta 3 sugerencias de nombres parecidos.
 */
export function buildResponsibleResolver(
  users: ResponsibleUser[],
): ResponsibleResolver {
  const byKey = new Map<string, Set<string>>();
  const displayByKey = new Map<string, string>();

  for (const user of users) {
    for (const key of nameKeys(user)) {
      const ids = byKey.get(key) ?? new Set<string>();
      ids.add(user.id_user);
      byKey.set(key, ids);
    }
    const primary = normalizePersonName(displayName(user));
    if (primary && !displayByKey.has(primary)) {
      displayByKey.set(primary, displayName(user));
    }
  }

  const candidateKeys = [...displayByKey.keys()];

  const suggest = (key: string): string[] => {
    const queryTokens = key.split(' ').filter(Boolean);

    // 1) Nombres que contienen todos los tokens escritos (ej. "javier garcia"
    //    sugiere "javier enrique garcia").
    let pool = candidateKeys.filter((candidate) => {
      const tokens = candidate.split(' ');
      return queryTokens.every((token) => tokens.includes(token));
    });

    // 2) Si no hay coincidencia por tokens, por cercanía (Levenshtein).
    if (pool.length === 0) {
      const maxDistance = Math.max(3, Math.floor(key.length / 3));
      pool = candidateKeys
        .map((candidate) => ({
          candidate,
          distance: levenshtein(key, candidate),
        }))
        .filter((entry) => entry.distance <= maxDistance)
        .sort((a, b) => a.distance - b.distance)
        .map((entry) => entry.candidate);
    }

    return pool
      .slice(0, MAX_SUGGESTIONS)
      .map((candidate) => displayByKey.get(candidate) ?? candidate);
  };

  const resolveToken = (token: string): { id?: string; error?: string } => {
    const key = normalizePersonName(token);
    if (!key) return {};

    const ids = byKey.get(key);
    if (!ids || ids.size === 0) {
      const suggestions = suggest(key);
      const hint =
        suggestions.length > 0 ? `. ¿Quizá ${suggestions.join(', ')}?` : '';
      return { error: `Responsable no encontrado: ${token.trim()}${hint}` };
    }
    if (ids.size > 1) {
      return {
        error: `Responsable ambiguo (varios usuarios): ${token.trim()}`,
      };
    }
    return { id: [...ids][0] };
  };

  return {
    resolve(raw: string) {
      const tokens = String(raw ?? '')
        .split(/[,;]/)
        .map((token) => token.trim())
        .filter(Boolean);

      const ids: string[] = [];
      const errors: string[] = [];
      const seen = new Set<string>();

      for (const token of tokens) {
        const { id, error } = resolveToken(token);
        if (error) {
          errors.push(error);
        } else if (id && !seen.has(id)) {
          seen.add(id);
          ids.push(id);
        }
      }

      return { ids, errors };
    },
  };
}
