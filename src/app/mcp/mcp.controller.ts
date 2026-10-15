import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import type { Request, Response } from 'express';
import { Public } from '../../common/decorators/public.decorator';
import { SkipTransform } from '../../common/decorators/skip-transform.decorator';
import { MCP_ENDPOINT_PATH } from './constants/mcp.constants';
import { McpAuthGuard } from './guards/mcp-auth.guard';
import { McpServerFactory } from './mcp-server.factory';
import { McpAuditService } from './audit/mcp-audit.service';

/**
 * Endpoint MCP (Streamable HTTP) montado como controlador NestJS.
 *
 * - `@Public()` desactiva el `AuthGuard` global (JWT de la app): el MCP se
 *   autentica con su propio token mediante `McpAuthGuard`.
 * - `@SkipTransform()` evita que el `TransformInterceptor` global envuelva la
 *   respuesta JSON-RPC (lo rompería).
 * - `@Throttle` sube el límite porque una sesión MCP hace varias llamadas.
 */
@Controller(MCP_ENDPOINT_PATH)
@Public()
@SkipTransform()
@UseGuards(McpAuthGuard)
@Throttle({ default: { limit: 600, ttl: 60000 } })
export class McpController {
  constructor(
    private readonly serverFactory: McpServerFactory,
    private readonly audit: McpAuditService,
  ) {}

  @Post()
  async handlePost(
    @Req() req: Request,
    @Res() res: Response,
    @Body() body: unknown,
  ): Promise<void> {
    await this.handle(req, res, body);
  }

  @Get()
  async handleGet(@Req() req: Request, @Res() res: Response): Promise<void> {
    await this.handle(req, res, undefined);
  }

  @Delete()
  async handleDelete(@Req() req: Request, @Res() res: Response): Promise<void> {
    await this.handle(req, res, undefined);
  }

  /**
   * Crea un servidor MCP stateless por petición y delega en el transporte
   * Streamable HTTP del SDK oficial.
   */
  private async handle(
    req: Request,
    res: Response,
    body: unknown,
  ): Promise<void> {
    const startedAt = Date.now();
    const server = this.serverFactory.create();
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // stateless
      enableJsonResponse: true, // respuesta JSON en vez de SSE
    });

    res.on('close', () => {
      void transport.close();
      void server.close();
    });

    await server.connect(transport);
    try {
      await transport.handleRequest(req, res, body);
    } finally {
      this.audit.logToolCall({
        request: req,
        body,
        statusCode: res.statusCode,
        durationMs: Date.now() - startedAt,
      });
    }
  }
}
