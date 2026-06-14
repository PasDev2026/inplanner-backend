# Plan de Optimización — Inplanner

> **Objetivo:** Escalar a 10,000+ proyectos con múltiples tareas sin degradación de rendimiento.
> **Fecha:** Junio 2026

---

## Resumen de prioridades

| # | Cambio | Área | Esfuerzo | Impacto |
|---|--------|------|----------|---------|
| 1 | Índices en base de datos | Backend | ⭐ Bajo | 🔥 Crítico |
| 2 | Paginar endpoints de tareas | Backend + Frontend | ⭐⭐⭐ Medio | 🔥 Crítico |
| 3 | `staleTime` global y por query | Frontend | ⭐ Bajo | 🔥 Crítico |
| 4 | No invalidar `["projects"]` desde tareas | Frontend | ⭐⭐ Medio | 🔥 Alto |
| 5 | Fix N+1 en responsables | Backend | ⭐ Bajo | 🔥 Alto |
| 6 | Optimizar updates (no cargar relaciones) | Backend | ⭐ Bajo | 🔥 Alto |
| 7 | Pool de conexiones a BD | Backend | ⭐ Bajo | ⭐ Medio |
| 8 | Virtualización de listas | Frontend | ⭐⭐⭐ Medio | ⭐ Medio |
| 9 | Query keys específicas para invalidaciones | Frontend | ⭐ Bajo | ⭐ Medio |
| 10 | Eliminar fetch duplicado en TaskTableSection | Frontend | ⭐ Bajo | ⭐ Bajo |

---

## Diagnóstico completo

### Backend — Base de datos

#### Sin índices en columnas críticas

**Ninguna foreign key ni columna de filtro tiene `@Index()`.** El ORM mapea correctamente las relaciones, pero PostgreSQL hará **sequential scan** en cada consulta filtrada.

| Entidad | Columna | Uso |
|---------|---------|-----|
| `project.entity.ts` | `sede_id` | FK a `centralizado.sede` |
| `project.entity.ts` | `manager_id` | FK a `users` |
| `project.entity.ts` | `status` | Filtro en listados |
| `task.entity.ts` | `project_id` | FK a `projects` — **el más crítico** |
| `task.entity.ts` | `parent_task_id` | FK self (subtasks) |
| `task.entity.ts` | `status` | Filtro en kanban |
| `task.entity.ts` | `created_by_id` | FK a `users` |
| `note.entity.ts` | `task_id` | FK a `tasks` |
| `note.entity.ts` | `created_by_id` | FK a `users` |
| `refresh-token.entity.ts` | `user_id` | FK a `users` |
| `user.entity.ts` | `area_id` | FK a `areas` |

#### N+1 en ProjectsService

**Archivo:** `src/modules/projects/projects.service.ts:65-71` y `:85`

```ts
relations: { responsibles: true }
```

Carga `ProjectResponsibleEntity` pero **no** el `user` anidado. Si algún código itera `project.responsibles` y accede a `.user`, se dispara **1 query por cada responsable**.

#### Updates ineficientes

**Archivos:** `projects.service.ts:92-96`, `tasks.service.ts:93-97`, `users.service.ts:109-131`

```ts
const project = await this.findOne(id);  // Carga TODAS las relaciones
Object.assign(project, dto);
return this.projectRepository.save(project);
```

Para cambiar solo `name_project`, se cargan todas las relaciones vía joins, se hidrata la entidad completa, y luego `save()` hace diff de todos los campos.

#### Hard delete en proyectos y tareas

`remove()` primero carga la entidad con `findOne()` (con relaciones), luego hace `remove()` que dispara DELETE en cascada. Sin soft delete, eliminar un proyecto con 10,000 tareas puede lockear tablas por segundos.

#### Sin pool de conexiones configurado

**Archivo:** `src/config/database.config.ts`

```ts
extra: {
  ssl: { rejectUnauthorized: false }
  // Sin max, idleTimeoutMillis, query_timeout
}
```

TypeORM/PG default pool size puede ser 10. Con concurrencia alta, las requests se encolan.

---

### Backend — Endpoints

#### Tasks findAll sin paginación real

`GET /tasks?project_id=X` acepta `page` y `limit` pero en el frontend se llama **sin ellos**. Retorna **todas** las tareas de un proyecto en un solo response. Con 10,000+ tareas, esto son cientos de KB o MB por request.

#### Búsqueda de usuarios con leading wildcard

```ts
ILike(`%${search}%`)  // leading % impide usar índices B-tree
```

Cada búsqueda de usuario escanea 5 columnas completas.

---

### Frontend — React Query

#### Sin staleTime global

**Archivo:** `src/features/shared/providers/AppProviders.tsx`

```ts
const queryClient = new QueryClient()  // Sin defaultOptions
```

`staleTime: 0` (default) significa que **cada** montaje de componente y **cada** window focus gatilla un refetch completo. Con 10,000 proyectos, esto es tráfico masivo e innecesario.

#### Invalidaciones demasiado amplias

Cada mutación de tarea invalida `["projects"]`, forzando un refetch de **todos** los proyectos del dashboard:

| Archivo | Invalida | Frecuencia |
|---------|----------|------------|
| `useUpdateTask.ts` | `["projects"]` | Cada edición de tarea |
| `useUpdateProject.ts` | `["projects"]` | Cada cambio en proyecto |
| `useUpdateProjectResponsible.ts` | `["projects"]` | Cada asignación |
| `TaskList.tsx` | `["projects"]` | Cada drag & drop (cambio de status) |
| `TaskCard.tsx` | `["projects"]` | Cada eliminación |
| `TaskTableSection.tsx` | `["projects"]` | Cada creación de tarea |
| `TaskTableSubtasks.tsx` | `["projects"]` | Cada creación de subtarea |

#### Query keys sin scope

```ts
invalidateQueries({ queryKey: ["taskChildren"] })
```

Invalida **todos** los hijos de todas las tareas. Debería ser:

```ts
invalidateQueries({ queryKey: ["taskChildren", taskId] })
```

---

### Frontend — Carga de datos

#### Tasks de proyecto sin paginación

**Archivo:** `src/features/shared/actions/project.api.ts:101-111`

```ts
const { data } = await api.get(`/tasks`, { params: { project_id: projectId } });
```

No envía `page` ni `limit`. Retorna **todas** las tareas.

**Archivo:** `src/features/projects/pages/ProjectDetailPage.tsx:33-41`

Usa `useQuery` simple (no `useInfiniteQuery`). Sin `staleTime`.

#### Fetch duplicado en TaskTableSection

**Archivo:** `src/features/tasks/components/TaskTableSection.tsx:48-56`

Hace el mismo `getProjectTasks(projectIdNum)` que ya hizo `ProjectDetailPage`. React Query lo cachea (mismo key), pero igual es código duplicado.

---

### Frontend — Renderizado

#### Sin virtualización

- **Proyectos:** `DashboardPage.tsx:273-283` — `.map()` sobre todas las filas, cada una con múltiples componentes anidados (popovers, badges, menús). Con 10,000+ filas en el DOM, el navegador se congela.
- **Tareas:** `TaskColumn.tsx:48-49` — `.map()` sobre todas las tarjetas en cada columna. Cada `TaskCard` registra `useDraggable`. 10,000+ drag sources matan el rendimiento de drag & drop.

#### Filtrado y ordenamiento cliente-side

**Archivo:** `DashboardPage.tsx:123-132`

```ts
.filter(p => /* ... */).sort((a, b) => /* ... */)
```

Todo el listado de proyectos se filtra y ordena en memoria del navegador cada render. Debería hacerse server-side.

---

## Plan de ejecución

### Fase 1 — Quick wins (bajo esfuerzo, alto impacto)

#### 1.1 Agregar `@Index()` en entidades

**Archivos a modificar:**
- `src/modules/projects/project.entity.ts` — `@Index()` en `sede_id`, `manager_id`
- `src/modules/tasks/task.entity.ts` — `@Index()` en `project_id`, `parent_task_id`, `status`, `created_by_id`
- `src/modules/notes/note.entity.ts` — `@Index()` en `task_id`, `created_by_id`
- `src/modules/users/user.entity.ts` — `@Index()` en `area_id`
- `src/modules/auth/refresh-token.entity.ts` — `@Index()` en `user_id`

Además agregar índices compuestos donde tenga sentido:
- `tasks(project_id, status)` — para filtrar tareas por proyecto y status
- `tasks(project_id, parent_task_id)` — para cargar root tasks de un proyecto

Generar y ejecutar migración.

#### 1.2 Fix N+1 en responsible.user

**Archivo:** `src/modules/projects/projects.service.ts`

```diff
- relations: { responsibles: true }
+ relations: { responsibles: { user: true } }
```

Aplicar en `findAll` (línea 65) y `findOne` (línea 85).

#### 1.3 Optimizar updates

**Archivos:** `projects.service.ts`, `tasks.service.ts`, `users.service.ts`

Reemplazar patrón `findOne()` + `save()` por `update()` directo:

```ts
// En vez de:
const entity = await this.findOne(id);
Object.assign(entity, dto);
return this.repository.save(entity);

// Usar:
await this.repository.update(id, dto);
return this.repository.findOne({ where: { id } });  // sin relaciones
```

#### 1.4 Pool de conexiones

**Archivo:** `src/config/database.config.ts` y `src/app.module.ts`

Agregar:
```ts
extra: {
  ssl: { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
  query_timeout: 10000,
}
```

#### 1.5 staleTime global y por query

**Archivo:** `src/features/shared/providers/AppProviders.tsx`

```ts
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
    },
  },
});
```

**Archivos adicionales:**
- `DashboardPage.tsx` — `staleTime: 60_000` en `["projects"]`
- `ProjectDetailPage.tsx` — `staleTime: 30_000` en `["projectTasks"]`

---

### Fase 2 — Arquitectura de datos (esfuerzo medio, impacto crítico)

#### 2.1 Paginar tareas

**Backend — `src/modules/tasks/tasks.service.ts`:**

Verificar que `findAll` aplique correctamente `skip`/`take` desde los `query-task.dto.ts`. Si ya recibe `page`/`limit` pero no los usa, conectarlos.

**Frontend — `src/features/shared/actions/project.api.ts`:**

```diff
- export async function getProjectTasks(projectId: number) {
+ export async function getProjectTasks(projectId: number, page = 1, limit = 50) {
+   const params: Record<string, string | number> = { project_id: projectId, page, limit };
    const { data } = await api.get(`/tasks`, { params });
    return data;
  }
```

**Frontend — `ProjectDetailPage.tsx`:** Cambiar a `useInfiniteQuery` con `getNextPageParam` (como ya hace Dashboard con proyectos).

**Frontend — `TaskTableSection.tsx`:** Eliminar fetch duplicado, recibir tasks como prop.

#### 2.2 Scope correcto en invalidaciones

**Archivos a modificar:** `useUpdateTask.ts`, `useTaskMutations.ts`, `TaskList.tsx`, `TaskCard.tsx`, `TaskTableSection.tsx`, `TaskTableSubtasks.tsx`

Reglas:
- No invalidar `["projects"]` desde mutaciones de tareas
- Usar `["taskChildren", taskId]` en vez de `["taskChildren"]`
- Invalidar `["projectTasks", projectId]` con el ID específico

#### 2.3 Query keys específicas

```diff
- invalidateQueries({ queryKey: ["taskChildren"] })
+ invalidateQueries({ queryKey: ["taskChildren", taskId] })
```

---

### Fase 3 — Escalabilidad (esfuerzo medio-alto, impacto medio-alto)

#### 3.1 Soft delete para proyectos y tareas

Agregar columna `deleted_at` (timestamp nullable) a `ProjectEntity` y `TaskEntity`. Cambiar `remove()` a marcar como eliminado en vez de DELETE físico.

Actualizar queries de `findAll` para filtrar `WHERE deleted_at IS NULL`.

Migrar datos existentes.

#### 3.2 Filtrado y orden server-side en Dashboard

Mover el filtrado y ordenamiento de `DashboardPage.tsx:123-132` al backend. El frontend solo debe enviar los parámetros y recibir datos ya filtrados/ordenados.

#### 3.3 Virtualización

Agregar `@tanstack/react-virtual` para:
- Tabla de proyectos en Dashboard
- Columnas de tareas en Kanban
- Lista de subtareas

---

## Resumen de archivos a modificar

### Backend (8 archivos)

| Archivo | Cambio |
|---------|--------|
| `src/modules/projects/project.entity.ts` | @Index en sede_id, manager_id |
| `src/modules/tasks/task.entity.ts` | @Index en project_id, parent_task_id, status |
| `src/modules/notes/note.entity.ts` | @Index en task_id, created_by_id |
| `src/modules/users/user.entity.ts` | @Index en area_id |
| `src/modules/auth/refresh-token.entity.ts` | @Index en user_id |
| `src/modules/projects/projects.service.ts` | Fix N+1, optimizar update |
| `src/modules/tasks/tasks.service.ts` | Paginación real, optimizar update |
| `src/config/database.config.ts` | Pool conexiones |

### Frontend (12+ archivos)

| Archivo | Cambio |
|---------|--------|
| `AppProviders.tsx` | defaultOptions con staleTime |
| `DashboardPage.tsx` | staleTime, virtualización |
| `ProjectDetailPage.tsx` | useInfiniteQuery, staleTime |
| `project.api.ts` | Paginar getProjectTasks |
| `task.api.ts` | (sin cambios) |
| `useUpdateTask.ts` | No invalidar ["projects"] |
| `useTaskMutations.ts` | Query key específica |
| `useUpdateProject.ts` | (revisar) |
| `TaskList.tsx` | No invalidar ["projects"] |
| `TaskCard.tsx` | No invalidar ["projects"] |
| `TaskTableSection.tsx` | Eliminar fetch duplicado |
| `TaskTableSubtasks.tsx` | Query key específica |

---

## Estado de implementación

| # | Tarea | Estado |
|---|-------|--------|
| 1.1 | @Index en entidades | ⬜ Pendiente |
| 1.2 | Fix N+1 responsibles | ⬜ Pendiente |
| 1.3 | Optimizar updates | ⬜ Pendiente |
| 1.4 | Pool de conexiones | ⬜ Pendiente |
| 1.5 | staleTime global/queries | ⬜ Pendiente |
| 2.1 | Paginar tareas | ⬜ Pendiente |
| 2.2 | Scope en invalidaciones | ⬜ Pendiente |
| 2.3 | Query keys específicas | ⬜ Pendiente |
| 3.1 | Soft delete | ⬜ Pendiente |
| 3.2 | Filtrado server-side | ⬜ Pendiente |
| 3.3 | Virtualización | ⬜ Pendiente |
