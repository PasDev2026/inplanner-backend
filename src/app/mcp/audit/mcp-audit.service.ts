import { Injectable, Logger } from '@nestjs/common';

interface ToolCall {
  name: string;
  args: unknown;
}

/** Datos mínimos de la petición que necesita la auditoría. */
export interface AuditRequestContext {
  ip?: string;
  headers: Record<string, unknown>;
}

/**
 * Auditoría de llamadas al MCP.
 *
 * Registra una entrada estructurada por cada `tools/call`, con la herramienta,
 * sus argumentos, IP, request-id, código de estado y duración. Nunca lanza:
 * un fallo de auditoría no debe romper la petición.
 */
@Injectable()
export class McpAuditService {
  private readonly logger = new Logger('McpAudit');

  logToolCall(params: {
    request: AuditRequestContext;
    body: unknown;
    statusCode: number;
    durationMs: number;
  }): void {
    try {
      const call = this.extractToolCall(params.body);
      if (!call) return;

      this.logger.log(
        JSON.stringify({
          event: 'mcp_tool_call',
          tool: call.name,
          arguments: call.args ?? {},
          ip: params.request.ip,
          requestId: params.request.headers['x-request-id'],
          statusCode: params.statusCode,
          durationMs: params.durationMs,
        }),
      );
    } catch {
      // la auditoría nunca debe romper la petición
    }
  }

  /** Extrae el `tools/call` del cuerpo JSON-RPC (soporta lotes). */
  private extractToolCall(body: unknown): ToolCall | null {
    const message: unknown = Array.isArray(body)
      ? (body as unknown[])[0]
      : body;
    if (!message || typeof message !== 'object') return null;

    const candidate = message as {
      method?: string;
      params?: { name?: string; arguments?: unknown };
    };
    if (candidate.method !== 'tools/call') return null;

    const name = candidate.params?.name;
    if (typeof name !== 'string') return null;

    return { name, args: candidate.params?.arguments };
  }
}
