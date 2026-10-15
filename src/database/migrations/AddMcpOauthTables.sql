-- ============================================================
-- oauth del MCP (persistencia del servidor de autorización)
-- oauth_clients:         clientes registrados dinámicamente (DCR)
-- oauth_refresh_tokens:  refresh tokens (guardados como hash sha256, nunca en claro)
-- client_id usa uuid (no serial)
-- ============================================================

create table if not exists inplanner.oauth_clients
(
    client_id                  uuid primary key default gen_random_uuid(),
    client_name                text,
    redirect_uris              jsonb       not null default '[]'::jsonb,
    token_endpoint_auth_method text        not null default 'none',
    estado                     boolean     not null default true,
    created_at                 timestamp default current_timestamp
);

create table if not exists inplanner.oauth_refresh_tokens
(
    id         uuid primary key default gen_random_uuid(),
    token_hash text        not null unique,
    client_id  uuid        not null references inplanner.oauth_clients (client_id) on delete cascade,
    scope      text,
    resource   text        not null,
    revoked    boolean     not null default false,
    expires_at timestamptz not null,
    created_at timestamp default current_timestamp
);

create index if not exists idx_oauth_refresh_client on inplanner.oauth_refresh_tokens (client_id);
create index if not exists idx_oauth_refresh_expires on inplanner.oauth_refresh_tokens (expires_at);
