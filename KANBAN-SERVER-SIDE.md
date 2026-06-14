# Kanban Server-Side — Feature futura

> **Propósito:** Escalar el Kanban a proyectos con miles de tareas sin degradar rendimiento.
> **Estado:** ⏳ Pendiente (documentación para implementación futura)

---

## Problema actual

`GET /api/v1/tasks?project_id=X&limit=0` devuelve **todas** las tareas del proyecto.
El frontend las agrupa por status en memoria (`TaskList.tsx:27-31`).

Con 1000+ tareas por proyecto:

| Aspecto | Problema |
|---------|----------|
| Payload de red | KB o MB por request |
| Memoria del frontend | Todos los objetos en RAM |
| Drag & drop | 1000+ `useDraggable` registrados |
| Filtrado | 100% client-side, O(n) en cada render |
| Refetch post-mutación | Recarga todo el set |

---

## Solución propuesta

### Backend — Nuevos endpoints

#### 1. Obtener Kanban completo (carga inicial)

```
GET /api/v1/projects/:projectId/kanban
```

Responde las tareas **ya agrupadas por columna**, con paginación por columna:

```json
{
  "columns": {
    "0": { "status": 0, "label": "Pendiente",    "total": 2340, "tasks": [ ... ] },
    "1": { "status": 1, "label": "En espera",     "total": 1560, "tasks": [ ... ] },
    "2": { "status": 2, "label": "En progreso",   "total": 3200, "tasks": [ ... ] },
    "3": { "status": 3, "label": "En revisión",   "total": 890,  "tasks": [ ... ] },
    "4": { "status": 4, "label": "Completado",    "total": 2010, "tasks": [ ... ] }
  }
}
```

Cada columna trae un lote inicial (ej. 20 tareas) + `total` para saber cuántas faltan.

#### 2. Paginación por columna (scroll infinito)

```
GET /api/v1/projects/:projectId/kanban/column/2?page=2&limit=20
```

```json
{
  "column": 2,
  "tasks": [ ... ],
  "meta": { "page": 2, "limit": 20, "total": 3200, "totalPages": 160 }
}
```

#### 3. Endpoints existentes que se mantienen

- `PATCH /api/v1/tasks/:id/status` — sin cambios
- `PATCH /api/v1/tasks/:id` — sin cambios
- `GET /api/v1/tasks/:id/children` — sin cambios

### Frontend — Columnas independientes

Cada `TaskColumn` deja de recibir tareas filtradas del padre y pasa a tener su propio `useInfiniteQuery`:

```tsx
// TaskColumn.tsx
function TaskColumn({ projectId, status }: { projectId: number; status: number }) {
  const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: ["kanbanColumn", projectId, status],
    queryFn: ({ pageParam }) =>
      getKanbanColumn(projectId, status, pageParam, 20),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, totalPages } = lastPage.meta;
      return page < totalPages ? page + 1 : undefined;
    },
    staleTime: 30_000,
  });

  const tasks = data?.pages.flatMap(p => p.tasks) ?? [];

  return (
    <div>
      {tasks.map(task => <TaskCard key={task.id_task} task={task} />)}
      {hasNextPage && <InfiniteScroll onLoadMore={fetchNextPage} />}
    </div>
  );
}
```

### Drag & Drop con Server-Side

```
1. Usuario arrastra tarea de columna A a columna B
2. Frontend: optimistic update (mueve la card al instante)
3. Frontend: PATCH /tasks/{id}/status { status: nuevoStatus }
4. Backend: actualiza BD, responde 200
5. Frontend: invalidateQueries(["kanbanColumn", projectId, statusOrigen])
6. Frontend: invalidateQueries(["kanbanColumn", projectId, statusDestino])
```

Solo se refetchean las 2 columnas afectadas, no las 5.

### Virtualización con `@tanstack/react-virtual`

```tsx
import { useVirtualizer } from "@tanstack/react-virtual";

function TaskColumn({ tasks }: { tasks: BackendTask[] }) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: tasks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 120,
  });

  return (
    <div ref={parentRef} style={{ height: "80vh", overflow: "auto" }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: "absolute",
              top: 0,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            <TaskCard task={tasks[virtualItem.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

Renderiza solo las 10-15 tarjetas visibles sin importar que hayan 10,000.

---

## Esfuerzo estimado

| Componente | Archivos | Días |
|------------|----------|------|
| Backend: endpoint `kanban` | 1 controller + 1 service + 2 DTOs | 1 |
| Backend: endpoint `kanban/column/:status` | (mismo controller) | 0.5 |
| Frontend: `TaskColumn` con `useInfiniteQuery` | `TaskColumn.tsx` | 1 |
| Frontend: Virtualización | `TaskColumn.tsx` + `TaskCard.tsx` | 1 |
| Frontend: Optimistic drag & drop | `TaskList.tsx` | 0.5 |
| Frontend: Invalidación selectiva | hooks de mutaciones | 0.5 |
| Pruebas y ajustes | — | 1 |
| **Total** | | **~5.5 días** |

---

## Comparativa de escalabilidad

| Escenario | API actual (`limit=0`) | Kanban Server-Side |
|-----------|------------------------|---------------------|
| 500 tareas | 1 req, 500 rows | 1 req, ~100 rows |
| 10,000 tareas | 1 req, 10,000 rows ❌ | 1 req, ~100 rows |
| Drag & drop | Refetch 10,000 rows | Refetch ~40 rows |
| Memoria DOM | 10,000 nodos | ~75 nodos virtualizados |
| Filtro status | Client-side O(n) | Server-side WHERE con índice |

---

## Dependencias a agregar

```bash
pnpm add @tanstack/react-virtual
```

Backend no requiere nuevas dependencias (solo TypeORM + NestJS, ya están).
