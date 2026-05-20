create table auth_users (
    id varchar(255) primary key,
    email varchar(255) not null unique,
    password_hash varchar(255) not null,
    role varchar(50) not null,
    enabled boolean not null,
    customer_id varchar(255),
    provider_id varchar(255),
    created_at timestamptz not null,
    updated_at timestamptz not null
);

create unique index if not exists ux_auth_users_email_lower on auth_users (lower(email));

insert into auth_users (
    id, email, password_hash, role, enabled, customer_id, provider_id, created_at, updated_at
) values
    ('auth-cust-001', 'customer@demo.com', '{noop}demo123', 'CUSTOMER', true, 'cust-001', null, now(), now()),
    ('auth-sp-001', 'service@demo.com', '{noop}demo123', 'SERVICE', true, null, 'sp-001', now(), now()),
    ('auth-admin-001', 'admin@demo.com', '{noop}demo123', 'ADMIN', true, null, null, now(), now())
on conflict do nothing;

insert into auth_users (
    id, email, password_hash, role, enabled, customer_id, provider_id, created_at, updated_at
)
select
    'auth-customer-' || id,
    lower(email),
    '{noop}demo123',
    'CUSTOMER',
    status = 'ACTIVE',
    id,
    null,
    now(),
    now()
from customers
on conflict do nothing;

insert into auth_users (
    id, email, password_hash, role, enabled, customer_id, provider_id, created_at, updated_at
)
select
    'auth-provider-' || id,
    lower(email),
    '{noop}demo123',
    'SERVICE',
    status <> 'SUSPENDED',
    null,
    id,
    now(),
    now()
from service_providers
on conflict do nothing;
