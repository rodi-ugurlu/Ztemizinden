create table customers (
    id varchar(255) primary key,
    name varchar(255) not null,
    email varchar(255) not null unique,
    phone varchar(255) not null,
    company_name varchar(255) not null,
    city varchar(255) not null,
    status varchar(50) not null,
    created_at timestamptz not null,
    updated_at timestamptz not null
);

create unique index if not exists ux_customers_email_lower on customers (lower(email));
create unique index if not exists ux_service_providers_email_lower on service_providers (lower(email));

insert into customers (
    id, name, email, phone, company_name, city, status, created_at, updated_at
) values (
    'cust-001', 'Rodi Ugurlu', 'customer@demo.com', '+90 532 000 00 10',
    'Ztemizinden Demo', 'Istanbul', 'ACTIVE', now(), now()
) on conflict (id) do nothing;
