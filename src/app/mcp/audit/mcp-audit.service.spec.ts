import { McpAuditService } from './mcp-audit.service';

describe('McpAuditService', () => {
  const service = new McpAuditService();
  const request = { ip: '127.0.0.1', headers: {} };

  it('no lanza con cuerpos variados', () => {
    expect(() =>
      service.logToolCall({
        request,
        body: undefined,
        statusCode: 200,
        durationMs: 1,
      }),
    ).not.toThrow();
    expect(() =>
      service.logToolCall({
        request,
        body: null,
        statusCode: 200,
        durationMs: 1,
      }),
    ).not.toThrow();
    expect(() =>
      service.logToolCall({
        request,
        body: { jsonrpc: '2.0', method: 'initialize' },
        statusCode: 200,
        durationMs: 1,
      }),
    ).not.toThrow();
    expect(() =>
      service.logToolCall({
        request,
        body: {
          jsonrpc: '2.0',
          method: 'tools/call',
          params: { name: 'listar_proyectos', arguments: { limit: 5 } },
        },
        statusCode: 200,
        durationMs: 1,
      }),
    ).not.toThrow();
  });
});
