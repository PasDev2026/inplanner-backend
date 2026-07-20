CREATE SCHEMA IF NOT EXISTS inplanner;

-- ============================================================
-- areas (sin cambios vs legacy)
-- ============================================================
create table inplanner.areas
(
    id_area     serial primary key,
    nombre_area varchar(100) not null unique,
    estado      boolean default true
);

-- ============================================================
-- users (uuid PK, sin password/username, con numero_documento)
-- ============================================================
create table inplanner.users
(
    id_user          uuid default gen_random_uuid() primary key,
    numero_documento varchar(20)  not null unique,
    email            varchar(100),
    name             varchar(100) not null,
    apellido_paterno varchar(100),
    apellido_materno varchar(100),
    telefono         varchar(20),
    sede_id          uuid,
    estado           boolean      default true not null,
    area_id          integer references inplanner.areas on delete set null,
    persona_uuid     uuid         not null unique,
    created_at       timestamp    default current_timestamp,
    updated_at       timestamp    default current_timestamp
);

create index idx_users_area on inplanner.users (area_id);

-- ============================================================
-- projects (manager_id uuid, sede_id uuid sin FK local)
-- ============================================================
create table inplanner.projects
(
    id_project          serial primary key,
    name_project        varchar(150)                    not null,
    description_project text,
    sede_id             uuid,
    manager_id          uuid                            not null
                        references inplanner.users on delete restrict,
    start_date          timestamp,
    due_date            timestamp,
    status              smallint default 0 not null,
    priority            smallint,
    position            double precision default 1000,
    privacy_level       smallint         default 0 not null,
    created_at          timestamp        default current_timestamp,
    updated_at          timestamp        default current_timestamp
);

create index idx_projects_manager on inplanner.projects (manager_id);
create index idx_projects_sede on inplanner.projects (sede_id);
create index idx_projects_status on inplanner.projects (status);
create index idx_projects_priority on inplanner.projects (priority);
create index idx_projects_status_position on inplanner.projects (status, position);

-- ============================================================
-- project_responsibles (user_id uuid)
-- ============================================================
create table inplanner.project_responsibles
(
    project_id integer not null references inplanner.projects on delete cascade,
    user_id    uuid    not null references inplanner.users on delete cascade,
    primary key (project_id, user_id)
);

create index idx_project_resp_user on inplanner.project_responsibles (user_id);

-- ============================================================
-- tasks (created_by_id uuid, completed_by_id uuid)
-- ============================================================
create table inplanner.tasks
(
    id_task          serial primary key,
    task_name        varchar(150) not null,
    task_description text,
    project_id       integer      not null references inplanner.projects on delete cascade,
    parent_task_id   integer      references inplanner.tasks on delete cascade,
    created_by_id    uuid         not null references inplanner.users on delete restrict,
    completed_by_id  uuid         references inplanner.users on delete set null,
    start_date       timestamp,
    due_date         timestamp,
    status           smallint     default 0,
    priority         smallint,
    position         double precision default 1000,
    created_at       timestamp    default current_timestamp,
    updated_at       timestamp    default current_timestamp
);

create index idx_tasks_project on inplanner.tasks (project_id);
create index idx_tasks_created_by on inplanner.tasks (created_by_id);
create index idx_tasks_parent_task on inplanner.tasks (parent_task_id);
create index idx_tasks_status on inplanner.tasks (status);
create index idx_tasks_priority on inplanner.tasks (priority);
create index idx_tasks_project_parent on inplanner.tasks (project_id, parent_task_id);
create index idx_tasks_project_status on inplanner.tasks (project_id, status);

-- ============================================================
-- task_assignments (user_id uuid)
-- ============================================================
create table inplanner.task_assignments
(
    task_id integer not null references inplanner.tasks on delete cascade,
    user_id uuid    not null references inplanner.users on delete cascade,
    primary key (task_id, user_id)
);

create index idx_task_assign_user on inplanner.task_assignments (user_id);

-- ============================================================
-- notes (created_by_id uuid)
-- ============================================================
create table inplanner.notes
(
    id_note       serial primary key,
    content       text    not null,
    task_id       integer not null references inplanner.tasks on delete cascade,
    created_by_id uuid    not null references inplanner.users on delete restrict,
    created_at    timestamp default current_timestamp,
    updated_at    timestamp default current_timestamp
);

create index idx_notes_task on inplanner.notes (task_id);
create index idx_notes_created_by on inplanner.notes (created_by_id);
