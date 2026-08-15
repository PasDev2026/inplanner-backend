-- ============================================================
-- attachments (metadata de archivos subidos, tipo Trello)
-- id_attachment uuid (no serial)
-- ============================================================
create table inplanner.attachments
(
    id_attachment  uuid primary key default gen_random_uuid(),
    task_id        integer not null references inplanner.tasks (id_task) on delete cascade,
    created_by_id  uuid    not null references inplanner.users on delete restrict,
    file_name      text    not null,
    mime_type      text    not null,
    bytes          integer not null,
    file_path      text    not null,
    previews       jsonb   not null default '[]'::jsonb,
    created_at     timestamp default current_timestamp
);

create index idx_attachments_task on inplanner.attachments (task_id);
create index idx_attachments_created_by on inplanner.attachments (created_by_id);
