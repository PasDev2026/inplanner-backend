/**
 * Resolución de responsables de importación: convierte los nombres escritos en
 * el Excel (ej. "Juan Pérez, Ana López") a UUIDs de usuarios existentes, y
 * genera la lista de nombres válidos para el desplegable de la plantilla.
 *
 * Se usa el nombre completo (nombre + apellidos) para maximizar la
 * desambiguación. Si dos usuarios comparten exactamente el mismo nombre
 * completo, se agrega el número de documento (o email/id como respaldo) entre
 * paréntesis, de modo que el valor exportado siempre se pueda volver a
 * importar sin ambigüedad.
 *
 * Lógica pura (sin BD) para poder testearla aisladamente.
 */

export interface ResponsibleUser {
  id_user: string;
  name: string;
  apellido_paterno?: string | null;
  apellido_materno?: string | null;
  numero_documento?: string | null;
  email?: string | null;
  estado?: boolean;
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

/** Nombre completo visible: "Nombre ApellidoPaterno ApellidoMaterno". */
export function fullName(user: ResponsibleUser): string {
  return [user.name, user.apellido_paterno, user.apellido_materno]
    .map((part) => String(part ?? '').trim())
    .filter(Boolean)
    .join(' ');
}

/** Discriminador único para usuarios con el mismo nombre completo. */
function disambiguator(user: ResponsibleUser): string {
  return (
    String(user.numero_documento ?? '').trim() ||
    String(user.email ?? '').trim() ||
    String(user.id_user ?? '').trim()
  );
}

/**
 * Etiqueta única por usuario. Si dos usuarios comparten el mismo nombre
 * completo, ambos se etiquetan con su discriminador para que el Excel no sea
 * ambiguo al reimportar.
 */
export function buildResponsibleLabels(
  users: ResponsibleUser[],
): Map<string, string> {
  const byFullName = new Map<string, ResponsibleUser[]>();

  for (const user of users) {
    const name = fullName(user);
    const key = normalizePersonName(name);
    if (!key) continue;
    const group = byFullName.get(key) ?? [];
    group.push(user);
    byFullName.set(key, group);
  }

  const labels = new Map<string, string>();
  for (const group of byFullName.values()) {
    if (group.length === 1) {
      labels.set(group[0].id_user, fullName(group[0]));
      continue;
    }

    for (const user of group) {
      const suffix = disambiguator(user);
      labels.set(
        user.id_user,
        suffix ? `${fullName(user)} (${suffix})` : fullName(user),
      );
    }
  }

  return labels;
}

/** Claves de búsqueda válidas para un usuario (nombre corto y completo). */
function nameKeys(user: ResponsibleUser): string[] {
  const name = normalizePersonName(user.name ?? '');
  const paterno = normalizePersonName(user.apellido_paterno ?? '');
  const full = normalizePersonName(fullName(user));
  const keys: string[] = [];

  if (full) keys.push(full);
  if (name && paterno) keys.push(`${name} ${paterno}`);
  if (name && !paterno) keys.push(name);

  const suffix = disambiguator(user);
  if (full && suffix) {
    keys.push(normalizePersonName(`${fullName(user)} (${suffix})`));
  }

  return [...new Set(keys)];
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
 * Lista de etiquetas válidas para el desplegable, sin duplicados y ordenada.
 * Incluye a los usuarios con nombre completo repetido usando su documento.
 */
export function listResponsibleNames(users: ResponsibleUser[]): string[] {
  const labels = buildResponsibleLabels(users);
  const names = new Set<string>();

  for (const user of users) {
    const label = labels.get(user.id_user);
    if (label) names.add(label);
  }

  return [...names].sort((a, b) => a.localeCompare(b, 'es'));
}

/**
 * Construye un resolver a partir de la lista de usuarios. Si una misma clave
 * apunta a más de un usuario, se considera ambigua. Los errores de "no
 * encontrado" incluyen hasta 3 sugerencias de nombres parecidos.
 */
export function buildResponsibleResolver(
  users: ResponsibleUser[],
): ResponsibleResolver {
  const labels = buildResponsibleLabels(users);
  const byKey = new Map<string, Set<string>>();
  const displayByKey = new Map<string, string>();

  for (const user of users) {
    const label = labels.get(user.id_user) ?? fullName(user);
    for (const key of nameKeys(user)) {
      const ids = byKey.get(key) ?? new Set<string>();
      ids.add(user.id_user);
      byKey.set(key, ids);
      if (!displayByKey.has(key)) displayByKey.set(key, label);
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
