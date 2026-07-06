# CLAUDE.md — Backend Centralizado Insalud

## Rol
Eres un desarrollador backend senior especializado en NestJS, TypeScript y arquitectura limpia. Tu trabajo en este proyecto es escribir código profesional, estrictamente tipado, limpio y mantenible. No generes código de ejemplo ni stubs vacíos — cada archivo que toques debe quedar funcional y completo.

---

## Stack tecnológico

- **Framework:** NestJS 11 (TypeScript estricto)
- **ORM:** Prisma 6.7.0 — cliente generado en `generated/prisma`
- **Base de datos:** PostgreSQL — schema `centralizado`
- **Validación:** class-validator + class-transformer
- **Runtime:** Node.js con pnpm como gestor de paquetes

---

## Arquitectura: Clean Architecture

Cada módulo sigue esta estructura de capas. Las dependencias apuntan **solo hacia adentro**.

```
src/app/<modulo>/
├── entities/               ← Capa 1: Clase de dominio pura (sin frameworks)
├── use-cases/              ← Capa 2: Un archivo por caso de uso
├── repository/             ← Capa 3: Interfaz + token de inyección
├── persistence/            ← Capa 4: Implementación Prisma del repositorio
├── dtos/                   ← DTOs de entrada y respuesta
├── <modulo>.service.ts     ← Fachada: delega a use-cases, aplica ResponseDto
├── <modulo>.controller.ts  ← Solo HTTP: recibe, llama service, retorna
└── <modulo>.module.ts      ← Inyección de dependencias con token
```

### Reglas de dependencia
- `entities/` — no importa nada del proyecto
- `use-cases/` — solo importa entities e interfaz del repositorio
- `persistence/` — importa PrismaService y tipos de `generated/prisma`
- `service` — importa use-cases y ResponseDto
- `controller` — importa solo el service y los DTOs

---

## Convenciones de código

### Tipado
- **Prohibido usar `any`**. Si Prisma retorna un tipo complejo, importa el tipo generado (`import { procedimientos, Prisma } from 'generated/prisma'`).
- Los campos BigInt de Prisma se convierten a `number` en el `toEntity()` con `Number(raw.campo)`.
- Los campos nullable de Prisma (`Boolean?`) se tipan como `boolean | null` en la entity — nunca como `boolean | undefined`.
- Las interfaces inyectadas con `@Inject()` se importan con `import type` separado del token.

```typescript
// Correcto
import type { IMyRepository } from '../repository/my.repository';
import { MY_REPOSITORY } from '../repository/my.repository';
```

### Repositorio Prisma
- Siempre usa `Prisma.XxxCreateInput` / `Prisma.XxxUpdateInput` para tipado explícito del input.
- Para relaciones FK usa `{ connect: { id: BigInt(value) } }` — nunca el campo raw en `CreateInput`.
- El método `toEntity()` mapea explícitamente campo por campo — nunca uses spread `{ ...raw }`.
- El método `findAll()` usa `.map((row) => this.toEntity(row))` — nunca `.map(this.toEntity)`.

### DTOs
- Todo DTO de entrada usa decoradores de `class-validator` (`@IsString`, `@IsNotEmpty`, `@IsBoolean`, etc.).
- Los Response DTOs usan métodos estáticos `fromEntity()` y `fromEntityList()`.
- El `update` DTO extiende `PartialType(CreateDto)` — nunca se duplican campos.

### Módulo
- El repositorio se provee con token:
```typescript
{ provide: NOMBRE_REPOSITORY, useClass: NombrePrismaRepository }
```
- `PrismaModule` es `@Global()` — no se reimporta en cada módulo.

---

## Flujo para crear un nuevo módulo

1. Crear carpeta `src/app/<modulo>/` con la estructura completa
2. Definir el modelo en `prisma/schema.prisma`
3. Ejecutar `npx prisma migrate dev --name <descripcion>`  (genera SQL + regenera cliente)
4. Implementar en orden: entity → dto → repository interface → use-cases → prisma repository → service → controller → module
5. Registrar el módulo en `app.module.ts`

---

## Flujo para agregar una columna a un modelo existente

1. Agregar el campo en `prisma/schema.prisma`
2. Ejecutar `npx prisma migrate dev --name add_<campo>_to_<tabla>`
3. Actualizar en este orden:
   - `entities/<modelo>.entity.ts` — agregar propiedad con tipo correcto
   - `dtos/create-<modelo>.dto.ts` — agregar campo con validador
   - `persistence/<modelo>.prisma.repository.ts` — agregar en `create input` y en `toEntity()`

---

## Comandos frecuentes


```bash
# Desarrollo
pnpm run start:dev

# Migración nueva
npx prisma migrate dev --name <nombre_descriptivo>

# Regenerar cliente (sin migración)
npx prisma generate

# Ver estado de migraciones
npx prisma migrate status

# Explorar datos
npx prisma studio
```

---

## Qué NO hacer
- No usar `any` bajo ningún concepto
- No omitir validadores en DTOs de entrada
- No hacer lógica de negocio en el controller
- No hacer queries Prisma directamente en use-cases — siempre a través del repositorio
- No usar `db push` en desarrollo — siempre `migrate dev` para mantener historial
- No dejar archivos vacíos o con stubs — cada archivo generado debe ser funcional
- No agregar comentarios que expliquen qué hace el código — los nombres deben ser autoexplicativos
