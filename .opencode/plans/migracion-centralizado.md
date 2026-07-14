# Migración a Base de Datos Centralizada

## Objetivo
Migrar de sistema_insalud_crm_test a sistema_clinic_insalud_qa como única base de datos.
Arquitectura final: una sola BD con schema inplanner + schema centralizado.

## Problema principal

Tabla actual: centralizado.rol (id_rol bigint PK)
Tabla nueva: centralizado.roles (uuid_rol uuid PK)

Tabla actual: centralizado.sede (id_sede bigint PK)
Tabla nueva: centralizado.sedes (uuid_sede uuid PK)

### Columnas FK afectadas en schema inplanner

- user_roles.rol_id: bigint -> uuid
- user_sedes.sede_id: bigint -> uuid
- projects.sede_id: bigint -> uuid

### Hardcodes en código

- role-resolver.ts: case 15 -> SUPER_ADMIN, case 5 -> JEFATURA, case 6 -> PERSONAL

## Pendiente del usuario antes de ejecutar

- [ ] Obtener UUIDs de sistema_clinic_insalud_qa.centralizado.roles para los 3 roles
  - Super Administrador (id_rol=15 -> uuid_rol=?)
  - Jefatura (id_rol=5 -> uuid_rol=?)
  - Personal (id_rol=6 -> uuid_rol=?)
- [ ] Definir mapping completo old_id -> new_uuid para roles y sedes
- [ ] Definir estrategia para registros huérfanos

## Plan de ejecución

### Fase 1: Mapping de datos

CREATE TABLE inplanner.rol_mapping (old_id bigint, new_uuid uuid);
CREATE TABLE inplanner.sede_mapping (old_id bigint, new_uuid uuid);
INSERT INTO inplanner.rol_mapping VALUES (15, 'uuid-...');
-- ... resto del mapping

### Fase 2: Migrar FKs en BD actual

ALTER TABLE user_roles ADD COLUMN rol_id_new uuid;
UPDATE user_roles SET rol_id_new = ... FROM rol_mapping WHERE ...;
ALTER TABLE user_roles DROP COLUMN rol_id;
ALTER TABLE user_roles RENAME COLUMN rol_id_new TO rol_id;
-- Repetir para user_sedes.sede_id y projects.sede_id

### Fase 3: Actualizar entidades TypeORM

- rol.entity.ts: schema centralizado, name roles, PK uuid, columnas nuevas
- sede.entity.ts: schema centralizado, name sedes, PK uuid, columnas nuevas
- user-role.entity.ts: rol_id number -> string
- user-sede.entity.ts: sede_id number -> string
- project.entity.ts: sede_id number -> string

### Fase 4: Actualizar hardcodes

- role-resolver.ts: cambiar case 15 por case 'uuid-...'

### Fase 5: Migrar a sistema_clinic_insalud_qa

- Crear schema inplanner en la nueva BD
- Migrar todas las tablas con datos transformados
- Cambiar DATABASE_URL en .env
- Verificar que todo funciona en la nueva BD

### Fase 6: Limpieza

- Eliminar tablas viejas en sistema_insalud_crm_test

## Archivos a modificar

- .env
- src/app/centralizado/entities/rol.entity.ts
- src/app/centralizado/entities/sede.entity.ts
- src/app/users/entities/user-role.entity.ts
- src/app/users/entities/user-sede.entity.ts
- src/app/projects/entities/project.entity.ts
- src/common/resolvers/role-resolver.ts

## Notas

- Los nombres de roles/sedes viejos NO coinciden exactamente con los nuevos
- No se requiere cambiar PKs de otras tablas, solo las FK que apuntan a centralizado
