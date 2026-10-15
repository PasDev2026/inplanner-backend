/**
 * Constantes del servidor MCP de Inplanner.
 *
 * El path final del endpoint queda bajo el prefijo global de la API (`api/v1`),
 * porque MCP se monta como un controlador NestJS normal.
 */
export const MCP_SERVER_NAME = 'inplanner';
export const MCP_SERVER_VERSION = '0.1.0';

/** Path relativo del controlador MCP (sin el prefijo global). */
export const MCP_ENDPOINT_PATH = 'mcp';

/** Path completo del endpoint, tal como lo ven los clientes (Claude, ChatGPT). */
export const MCP_FULL_ENDPOINT_PATH = `/api/v1/${MCP_ENDPOINT_PATH}`;

/** Clave de la variable de entorno que contiene el token de acceso al MCP. */
export const MCP_TOKEN_ENV_KEY = 'MCP_AUTH_TOKEN';

/**
 * Nombre del query param que puede transportar el token.
 * Necesario para el conector remoto de Claude, cuya UI solo permite la URL.
 * Este parámetro se redacta en los logs (ver `RequestLoggerMiddleware`).
 */
export const MCP_TOKEN_QUERY_PARAM = 'token';

/**
 * Estado de una tarea.
 * 0=Pendiente, 1=En espera, 2=En progreso, 3=En revisión, 4=Completado
 */
export const TASK_STATUS_LABELS: Record<number, string> = {
  0: 'Pendiente',
  1: 'En espera',
  2: 'En progreso',
  3: 'En revisión',
  4: 'Completado',
};

/**
 * Estado de un proyecto (según el dashboard de Inplanner).
 * 0=planning, 1=active, 2=onHold, 3=completed, 4=cancelled
 *
 * OJO: NO es el mismo mapa que el de tareas. El 4 es "Completado" en tarea
 * pero "Cancelado" en proyecto.
 */
export const PROJECT_STATUS_LABELS: Record<number, string> = {
  0: 'Planificación',
  1: 'Activo',
  2: 'En espera',
  3: 'Completado',
  4: 'Cancelado',
};
