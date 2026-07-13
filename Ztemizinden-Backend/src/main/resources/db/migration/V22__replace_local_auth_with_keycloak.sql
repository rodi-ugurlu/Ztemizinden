alter table customers
    add column if not exists identity_subject varchar(255);

alter table service_providers
    add column if not exists identity_subject varchar(255);

create unique index if not exists ux_customers_identity_subject
    on customers(identity_subject)
    where identity_subject is not null;

create unique index if not exists ux_service_providers_identity_subject
    on service_providers(identity_subject)
    where identity_subject is not null;

-- Preserve only the non-secret identity mapping required for the one-time Keycloak rollout.
-- Legacy password hashes are deliberately not copied; migrated users must set a Keycloak password.
create table if not exists keycloak_identity_migration_queue (
    legacy_auth_user_id varchar(255) primary key,
    email varchar(255) not null unique,
    role varchar(50) not null,
    enabled boolean not null,
    customer_id varchar(255),
    provider_id varchar(255),
    identity_subject varchar(255),
    completed_at timestamptz,
    attempt_count integer not null default 0,
    last_error varchar(2000),
    created_at timestamptz not null default now()
);

insert into keycloak_identity_migration_queue (
    legacy_auth_user_id, email, role, enabled, customer_id, provider_id
)
select
    auth_user.id,
    lower(auth_user.email),
    auth_user.role,
    case
        when auth_user.role = 'SERVICE' then auth_user.enabled and provider.status = 'VERIFIED'
        else auth_user.enabled
    end,
    auth_user.customer_id,
    auth_user.provider_id
from auth_users auth_user
left join service_providers provider on provider.id = auth_user.provider_id
on conflict (legacy_auth_user_id) do nothing;

-- Passwords, reset tokens and runtime login state are owned exclusively by Keycloak.
drop table if exists password_reset_tokens;
drop table if exists auth_users;
