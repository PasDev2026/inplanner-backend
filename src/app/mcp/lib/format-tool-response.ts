/**
 * Resultado estándar de una tool MCP: contenido de texto plano.
 * `content` es el formato que espera el SDK de MCP.
 */
export interface McpToolTextResult {
  [key: string]: unknown;
  content: Array<{ type: 'text'; text: string }>;
}

/** Devuelve un texto plano como resultado de una tool. */
export function textResult(text: string): McpToolTextResult {
  return { content: [{ type: 'text', text }] };
}

/** Serializa cualquier dato a JSON legible y lo devuelve como resultado. */
export function jsonResult(data: unknown): McpToolTextResult {
  return textResult(JSON.stringify(data, null, 2));
}

/** Resultado que incluye un texto y un enlace a un recurso (p. ej. un Excel). */
export interface McpToolLinkResult {
  [key: string]: unknown;
  content: Array<
    | { type: 'text'; text: string }
    | { type: 'resource_link'; uri: string; name: string; mimeType?: string }
  >;
}

/** Devuelve un mensaje de texto junto a un enlace descargable. */
export function linkResult(params: {
  message: string;
  url: string;
  name: string;
  mimeType?: string;
}): McpToolLinkResult {
  return {
    content: [
      { type: 'text', text: params.message },
      {
        type: 'resource_link',
        uri: params.url,
        name: params.name,
        mimeType: params.mimeType,
      },
    ],
  };
}
