CREATE SCHEMA IF NOT EXISTS inplanner_si;

create table inplanner_si.areas
(
    id_area     serial
        primary key,
    nombre_area varchar(100) not null
        unique,
    estado      boolean default true
);

create table inplanner_si.users
(
    id_user          serial
        primary key,
    username         varchar(100)           not null
        unique,
    password         varchar(255)           not null,
    email            varchar(100)           not null
        unique,
    name             varchar(100)           not null,
    apellido_paterno varchar(100),
    apellido_materno varchar(100),
    dni              varchar(20)            not null
        unique,
    telefono         varchar(20),
    estado           boolean   default true not null,
    area_id          integer
        references inplanner_si.areas
            on delete set null,
    created_at       timestamp default CURRENT_TIMESTAMP,
    updated_at       timestamp default CURRENT_TIMESTAMP
);

create index idx_users_area
    on inplanner_si.users (area_id);

create table inplanner_si.projects
(
    id_project          serial
        primary key,
    name_project        varchar(150)                    not null,
    description_project text,
    sede_id             bigint
        references centralizado.sede
            on delete cascade,
    manager_id          integer                         not null
        references inplanner_si.users
            on delete restrict,
    start_date          timestamp,
    due_date            timestamp,
    status              smallint,
    priority            smallint,
    created_at          timestamp default CURRENT_TIMESTAMP,
    updated_at          timestamp default CURRENT_TIMESTAMP,
    privacy_level       smallint  default '0'::smallint not null
);

create index idx_projects_manager
    on inplanner_si.projects (manager_id);

create index idx_projects_sede
    on inplanner_si.projects (sede_id);

create index idx_projects_status
    on inplanner_si.projects (status);

create index idx_projects_priority
    on inplanner_si.projects (priority);

create table inplanner_si.project_responsibles
(
    project_id integer not null
        references inplanner_si.projects
            on delete cascade,
    user_id    integer not null
        references inplanner_si.users
            on delete cascade,
    primary key (project_id, user_id)
);

create index idx_project_resp_user
    on inplanner_si.project_responsibles (user_id);

create table inplanner_si.tasks
(
    id_task          serial
        primary key,
    task_name        varchar(150) not null,
    task_description text,
    project_id       integer      not null
        references inplanner_si.projects
            on delete cascade,
    parent_task_id   integer
        references inplanner_si.tasks
            on delete cascade,
    created_by_id    integer      not null
        references inplanner_si.users
            on delete restrict,
    completed_by_id  integer
        references inplanner_si.users
            on delete set null,
    start_date       timestamp,
    due_date         timestamp,
    status           smallint,
    priority         smallint,
    created_at       timestamp default CURRENT_TIMESTAMP,
    updated_at       timestamp default CURRENT_TIMESTAMP
);

create index idx_tasks_project
    on inplanner_si.tasks (project_id);

create index idx_tasks_created_by
    on inplanner_si.tasks (created_by_id);

create index idx_tasks_parent_task
    on inplanner_si.tasks (parent_task_id);

create index idx_tasks_status
    on inplanner_si.tasks (status);

create index idx_tasks_priority
    on inplanner_si.tasks (priority);

create index idx_tasks_project_parent
    on inplanner_si.tasks (project_id, parent_task_id);

create index idx_tasks_project_status
    on inplanner_si.tasks (project_id, status);

create table inplanner_si.task_assignments
(
    task_id integer not null
        references inplanner_si.tasks
            on delete cascade,
    user_id integer not null
        references inplanner_si.users
            on delete cascade,
    primary key (task_id, user_id)
);

create index idx_task_assign_user
    on inplanner_si.task_assignments (user_id);

create table inplanner_si.notes
(
    id_note       serial
        primary key,
    content       text    not null,
    task_id       integer not null
        references inplanner_si.tasks
            on delete cascade,
    created_by_id integer not null
        references inplanner_si.users
            on delete restrict,
    created_at    timestamp default CURRENT_TIMESTAMP,
    updated_at    timestamp default CURRENT_TIMESTAMP
);

create index idx_notes_task
    on inplanner_si.notes (task_id);

create index idx_notes_created_by
    on inplanner_si.notes (created_by_id);

create table inplanner_si.refresh_tokens
(
    id              serial
        primary key,
    token           varchar(255)            not null,
    user_id         integer                 not null
        constraint fk_refresh_tokens_user
            references inplanner_si.users
            on delete cascade,
    expiration_date timestamp,
    revoked         boolean   default false not null,
    created_at      timestamp default now() not null
);

create index idx_refresh_tokens_user
    on inplanner_si.refresh_tokens (user_id);

create index idx_refresh_tokens_token
    on inplanner_si.refresh_tokens (token);

create index idx_refresh_tokens_revoked
    on inplanner_si.refresh_tokens (revoked);

create table inplanner_si.user_sedes
(
    user_id integer not null
        references inplanner_si.users
            on delete cascade,
    sede_id bigint  not null
        references centralizado.sede
            on delete cascade,
    primary key (user_id, sede_id)
);

create index idx_user_sedes_sede
    on inplanner_si.user_sedes (sede_id);

create table inplanner_si.user_roles
(
    user_id integer not null
        references inplanner_si.users
            on delete cascade,
    rol_id  bigint  not null
        references centralizado.rol
            on delete restrict,
    primary key (user_id, rol_id)
);

create index idx_user_roles_rol
    on inplanner_si.user_roles (rol_id);
