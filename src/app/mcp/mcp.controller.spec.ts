import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import type { Server } from 'node:http';
import request from 'supertest';
import { AreasService } from '../areas/areas.service';
import { NotesService } from '../notes/notes.service';
import { ProjectsService } from '../projects/projects.service';
import { TasksService } from '../tasks/tasks.service';
import { UsersService } from '../users/users.service';
import { MCP_TOKEN_ENV_KEY } from './constants/mcp.constants';
import { McpAuthGuard } from './guards/mcp-auth.guard';
import { McpAuditService } from './audit/mcp-audit.service';
import { McpController } from './mcp.controller';
import { McpServerFactory } from './mcp-server.factory';
import { MCP_REPOSITORY } from './repository/mcp-repository.interface';
import { ExportDatasetUseCase } from './use-cases/export-dataset.use-case';
import { GetAreaDetailUseCase } from './use-cases/get-area-detail.use-case';
import { GetAreaPerformanceUseCase } from './use-cases/get-area-performance.use-case';
import { GetGeneralMetricsUseCase } from './use-cases/get-general-metrics.use-case';
import { GetOverdueTasksUseCase } from './use-cases/get-overdue-tasks.use-case';
import { GetProjectsSummaryUseCase } from './use-cases/get-projects-summary.use-case';
import { GetUserActivityUseCase } from './use-cases/get-user-activity.use-case';
import { GetUserLoadUseCase } from './use-cases/get-user-load.use-case';

const TEST_TOKEN = 'test-token-1234567890';
const MCP_ENDPOINT = '/api/v1/mcp';

const MCP_HEADERS = {
  'Content-Type': 'application/json',
  Accept: 'application/json, text/event-stream',
};

interface RpcBody {
  result?: {
    serverInfo?: { name?: string };
    tools?: Array<{ name: string }>;
    content?: Array<{ text?: string }>;
  };
}

const paginated = <T>(data: T[]) => ({
  data,
  meta: { page: 1, limit: 20, total: data.length, totalPages: 1 },
});

const httpServer = (app: INestApplication): Server =>
  app.getHttpServer() as Server;

const rpc = (res: request.Response): RpcBody => res.body as RpcBody;

const ALL_TOOLS = [
  'describir_sistema',
  'listar_proyectos',
  'detalle_proyecto',
  'resumen_proyectos',
  'buscar_tareas',
  'detalle_tarea',
  'jerarquia_tarea',
  'actividad_usuario',
  'carga_por_usuario',
  'tareas_vencidas',
  'listar_usuarios',
  'detalle_usuario',
  'listar_areas',
  'notas_de_tarea',
  'rendimiento_por_area',
  'detalle_area',
  'comparar_areas',
  'metricas_generales',
  'exportar_excel',
];

/** Envía una petición JSON-RPC al endpoint MCP con autenticación. */
function mcpCall(
  app: INestApplication,
  body: Record<string, unknown>,
): request.Test {
  return request(httpServer(app))
    .post(MCP_ENDPOINT)
    .set(MCP_HEADERS)
    .set('Authorization', `Bearer ${TEST_TOKEN}`)
    .send(body);
}

function toolCall(
  app: INestApplication,
  name: string,
  args: Record<string, unknown> = {},
): request.Test {
  return mcpCall(app, {
    jsonrpc: '2.0',
    id: 99,
    method: 'tools/call',
    params: { name, arguments: args },
  });
}

describe('McpController (F0 + F1 + F2)', () => {
  let app: INestApplication;

  const projectsService = {
    findAll: jest
      .fn()
      .mockResolvedValue(
        paginated([
          { id_project: 1, name_project: 'Proyecto de prueba', status: 1 },
        ]),
      ),
    findOne: jest
      .fn()
      .mockResolvedValue({ id_project: 1, name_project: 'Proyecto de prueba' }),
  };
  const tasksService = {
    findAll: jest
      .fn()
      .mockResolvedValue(paginated([{ id_task: 10, task_name: 'Tarea X' }])),
    findOne: jest.fn().mockResolvedValue({
      id_task: 10,
      task_name: 'Tarea X',
      assignments: [],
    }),
    findChildren: jest
      .fn()
      .mockResolvedValue([{ id_task: 11, task_name: 'Subtarea X' }]),
  };
  const usersService = {
    findAll: jest.fn().mockResolvedValue(
      paginated([
        {
          id_user: 'uuid-1',
          name: 'Juan',
          apellido_paterno: 'Perez',
          apellido_materno: 'Gomez',
          email: 'juan@example.com',
          telefono: '999999999',
          numero_documento: '12345678',
          estado: true,
          area: { id_area: 1, nombre_area: 'TI' },
        },
      ]),
    ),
    findOne: jest.fn().mockResolvedValue({
      id_user: 'uuid-1',
      name: 'Juan',
      apellido_paterno: 'Perez',
      apellido_materno: 'Gomez',
      email: 'juan@example.com',
      estado: true,
      area: { id_area: 1, nombre_area: 'TI' },
    }),
  };
  const areasService = {
    findAll: jest
      .fn()
      .mockResolvedValue(paginated([{ id_area: 1, nombre_area: 'TI' }])),
  };
  const notesService = {
    findAll: jest
      .fn()
      .mockResolvedValue(paginated([{ id_note: 1, content: 'Nota X' }])),
  };
  const mcpRepository = {
    getAreaPerformance: jest.fn().mockResolvedValue([
      {
        id_area: 1,
        nombre_area: 'TI',
        proyectos: 2,
        tareas: 10,
        completadas: 6,
        en_progreso: 3,
        vencidas: 1,
        avance: 60,
      },
    ]),
    getAreaDetail: jest.fn().mockResolvedValue({
      id_area: 1,
      nombre_area: 'TI',
      estado: true,
      usuarios: 3,
      proyectos: [],
    }),
    getUserActivity: jest.fn().mockResolvedValue({
      resumen: { creadas: 1, actualizadas: 2, completadas: 1 },
      tareas: [
        {
          id_task: 10,
          task_name: 'Tarea activa',
          status: 2,
          project_id: 1,
          created_at: new Date('2026-10-15T00:00:00Z'),
          updated_at: new Date('2026-10-15T00:00:00Z'),
        },
      ],
    }),
    getUserLoad: jest.fn().mockResolvedValue([
      {
        id_user: 'uuid-1',
        name: 'Juan',
        apellido_paterno: 'Perez',
        total: 5,
        pendientes: 2,
        en_progreso: 1,
        completadas: 2,
        vencidas: 1,
      },
    ]),
    getOverdueTasks: jest.fn().mockResolvedValue([
      {
        id_task: 10,
        task_name: 'Vencida',
        status: 2,
        due_date: new Date('2026-01-01T00:00:00Z'),
        project_id: 1,
        project_name: 'Proyecto',
        dias_vencida: 5,
      },
    ]),
    getGeneralMetrics: jest.fn().mockResolvedValue({
      proyectos: {
        total: 1,
        planificacion: 1,
        activo: 0,
        en_espera: 0,
        completado: 0,
        cancelado: 0,
      },
      tareas: {
        total: 1,
        pendientes: 0,
        en_espera: 0,
        en_progreso: 1,
        en_revision: 0,
        completadas: 0,
        vencidas: 0,
      },
    }),
    getProjectsBySede: jest
      .fn()
      .mockResolvedValue([{ sede_id: 'sede-1', proyectos: 2, completados: 1 }]),
    getProjectsForExport: jest.fn().mockResolvedValue([]),
    getTasksForExport: jest.fn().mockResolvedValue([]),
  };

  const exportDataset = {
    execute: jest.fn().mockResolvedValue({
      url: 'https://s3.example.com/export.xlsx',
      key: 'k',
      expiresInSeconds: 3600,
    }),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [McpController],
      providers: [
        McpServerFactory,
        McpAuthGuard,
        McpAuditService,
        GetAreaPerformanceUseCase,
        GetAreaDetailUseCase,
        GetGeneralMetricsUseCase,
        GetProjectsSummaryUseCase,
        GetUserActivityUseCase,
        GetUserLoadUseCase,
        GetOverdueTasksUseCase,
        { provide: ExportDatasetUseCase, useValue: exportDataset },
        { provide: MCP_REPOSITORY, useValue: mcpRepository },
        { provide: ProjectsService, useValue: projectsService },
        { provide: TasksService, useValue: tasksService },
        { provide: UsersService, useValue: usersService },
        { provide: AreasService, useValue: areasService },
        { provide: NotesService, useValue: notesService },
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) =>
              key === MCP_TOKEN_ENV_KEY ? TEST_TOKEN : undefined,
          },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('rechaza peticiones sin token (401)', async () => {
    const res = await request(httpServer(app))
      .post(MCP_ENDPOINT)
      .set(MCP_HEADERS)
      .send({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} });

    expect(res.status).toBe(401);
  });

  it('rechaza peticiones con token incorrecto (401)', async () => {
    const res = await request(httpServer(app))
      .post(MCP_ENDPOINT)
      .set(MCP_HEADERS)
      .set('Authorization', 'Bearer token-incorrecto')
      .send({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} });

    expect(res.status).toBe(401);
  });

  it('acepta el token por query param (?token=) — conector de Claude', async () => {
    const res = await request(httpServer(app))
      .post(`${MCP_ENDPOINT}?token=${TEST_TOKEN}`)
      .set(MCP_HEADERS)
      .send({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} });

    expect(res.status).toBe(200);
    expect((rpc(res).result?.tools ?? []).length).toBe(ALL_TOOLS.length);
  });

  it('rechaza un token inválido por query param (401)', async () => {
    const res = await request(httpServer(app))
      .post(`${MCP_ENDPOINT}?token=token-malo`)
      .set(MCP_HEADERS)
      .send({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} });

    expect(res.status).toBe(401);
  });

  it('completa el handshake initialize con token válido', async () => {
    const res = await mcpCall(app, {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-06-18',
        capabilities: {},
        clientInfo: { name: 'test', version: '1.0.0' },
      },
    });

    expect(res.status).toBe(200);
    expect(rpc(res).result?.serverInfo?.name).toBe('inplanner');
  });

  it('lista las 18 tools registradas', async () => {
    const res = await mcpCall(app, {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {},
    });

    expect(res.status).toBe(200);
    const names = (rpc(res).result?.tools ?? []).map((t) => t.name);
    expect(names).toEqual(expect.arrayContaining(ALL_TOOLS));
    expect(names).toHaveLength(ALL_TOOLS.length);
  });

  it('buscar_tareas delega en TasksService', async () => {
    const res = await toolCall(app, 'buscar_tareas', {
      project_id: 1,
      limit: 5,
    });

    expect(res.status).toBe(200);
    expect(tasksService.findAll).toHaveBeenCalled();
    expect(rpc(res).result?.content?.[0]?.text).toContain('Tarea X');
  });

  it('listar_usuarios NO expone datos personales (PII)', async () => {
    const res = await toolCall(app, 'listar_usuarios');

    expect(res.status).toBe(200);
    const text = rpc(res).result?.content?.[0]?.text ?? '';
    expect(text).toContain('Juan');
    expect(text).toContain('TI');
    expect(text).not.toContain('juan@example.com');
    expect(text).not.toContain('12345678');
    expect(text).not.toContain('999999999');
  });

  it('rendimiento_por_area delega en el repositorio', async () => {
    const res = await toolCall(app, 'rendimiento_por_area');

    expect(res.status).toBe(200);
    expect(mcpRepository.getAreaPerformance).toHaveBeenCalled();
    const text = rpc(res).result?.content?.[0]?.text ?? '';
    expect(text).toContain('TI');
    expect(text).toContain('avance');
  });

  it('actividad_usuario acepta un UUID y delega en el repositorio', async () => {
    const res = await toolCall(app, 'actividad_usuario', {
      usuario: '00000000-0000-4000-8000-000000000000',
    });

    expect(res.status).toBe(200);
    expect(mcpRepository.getUserActivity).toHaveBeenCalled();
    expect(rpc(res).result?.content?.[0]?.text).toContain('resumen');
  });

  it('metricas_generales devuelve proyectos y tareas', async () => {
    const res = await toolCall(app, 'metricas_generales');

    expect(res.status).toBe(200);
    expect(mcpRepository.getGeneralMetrics).toHaveBeenCalled();
    expect(rpc(res).result?.content?.[0]?.text).toContain('proyectos');
  });

  it('exportar_excel devuelve un enlace de descarga', async () => {
    const res = await toolCall(app, 'exportar_excel', {
      dataset: 'rendimiento_por_area',
    });

    expect(res.status).toBe(200);
    expect(exportDataset.execute).toHaveBeenCalledWith(
      'rendimiento_por_area',
      undefined,
    );
    expect(rpc(res).result?.content?.[0]?.text).toContain(
      'https://s3.example.com/export.xlsx',
    );
  });
});
