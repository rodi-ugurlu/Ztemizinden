create table assets (
    id varchar(255) primary key,
    owner_id varchar(255) not null,
    name varchar(255) not null,
    tag_no varchar(255) not null unique,
    type varchar(50) not null,
    brand varchar(255) not null,
    model varchar(255) not null,
    serial_number varchar(255) not null,
    purchase_date date,
    warranty_end_date date,
    status varchar(50) not null,
    location varchar(255),
    department varchar(255),
    description varchar(2000),
    created_at timestamptz not null,
    updated_at timestamptz not null
);

create table tickets (
    id varchar(255) primary key,
    customer_id varchar(255) not null,
    customer_name varchar(255) not null,
    customer_company varchar(255) not null,
    customer_location varchar(255) not null,
    asset_id varchar(255) not null references assets(id),
    title varchar(255) not null,
    description varchar(4000) not null,
    category varchar(50) not null,
    priority varchar(50) not null,
    status varchar(50) not null,
    sla_target_minutes integer not null,
    assigned_provider_id varchar(255),
    assigned_provider_name varchar(255),
    service_eta varchar(255),
    final_estimated_cost numeric(12, 2),
    final_actual_cost numeric(12, 2),
    final_billing_notes varchar(2000),
    billing_status varchar(50),
    created_at timestamptz not null,
    updated_at timestamptz not null
);

create table ticket_offers (
    id varchar(255) primary key,
    ticket_id varchar(255) not null references tickets(id) on delete cascade,
    provider_id varchar(255) not null,
    provider_name varchar(255) not null,
    type varchar(50) not null,
    estimated_cost numeric(12, 2) not null,
    eta varchar(255) not null,
    message varchar(2000) not null,
    status varchar(50) not null,
    created_at timestamptz not null,
    updated_at timestamptz not null
);

create table service_providers (
    id varchar(255) primary key,
    name varchar(255) not null,
    contact_name varchar(255) not null,
    email varchar(255) not null unique,
    phone varchar(255) not null,
    city varchar(255) not null,
    status varchar(50) not null,
    trusted boolean not null,
    rating numeric(3, 2) not null,
    completed_jobs integer not null,
    created_at timestamptz not null,
    updated_at timestamptz not null
);

create table service_provider_specialties (
    provider_id varchar(255) not null references service_providers(id) on delete cascade,
    specialty varchar(50) not null,
    primary key (provider_id, specialty)
);

create index idx_assets_owner on assets(owner_id);
create index idx_tickets_customer on tickets(customer_id);
create index idx_tickets_status_created on tickets(status, created_at);
create index idx_ticket_offers_ticket on ticket_offers(ticket_id);
