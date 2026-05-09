create table ticket_messages (
    id varchar(255) primary key,
    ticket_id varchar(255) not null references tickets(id) on delete cascade,
    sender_role varchar(50) not null,
    sender_name varchar(255) not null,
    body varchar(2000) not null,
    created_at timestamptz not null,
    updated_at timestamptz not null
);

create index idx_ticket_messages_ticket on ticket_messages(ticket_id);

insert into assets (
    id, owner_id, name, tag_no, type, brand, model, serial_number, purchase_date,
    warranty_end_date, status, location, department, description, created_at, updated_at
) values (
    'asset-001', 'cust-001', 'Ana Hat Kompresoru', 'CMP-001', 'FACILITY', 'Atlas Copco',
    'GA 37 VSD+', 'AC-2025-001', date '2025-02-10', date '2027-02-10', 'ACTIVE',
    'Istanbul, Tuzla', 'Uretim', 'Hat basincini besleyen ana kompresor.', now(), now()
) on conflict (id) do nothing;

insert into assets (
    id, owner_id, name, tag_no, type, brand, model, serial_number, purchase_date,
    warranty_end_date, status, location, department, description, created_at, updated_at
) values (
    'asset-002', 'cust-001', 'Hidrolik Pres 120T', 'PRS-120', 'SME', 'Hursan',
    'HP-120', 'HP120-7781', date '2024-11-05', date '2026-11-05', 'ACTIVE',
    'Istanbul, Tuzla', 'Bakim', 'Hidrolik uretim presi.', now(), now()
) on conflict (id) do nothing;

insert into service_providers (
    id, name, contact_name, email, phone, city, status, trusted, rating, completed_jobs, created_at, updated_at
) values (
    'sp-001', 'Kaya Hidrolik Servis', 'Mert Kaya', 'mert@kayahidrolik.test', '+90 532 000 00 01',
    'Istanbul', 'VERIFIED', true, 4.80, 142, now(), now()
) on conflict (id) do nothing;

insert into service_providers (
    id, name, contact_name, email, phone, city, status, trusted, rating, completed_jobs, created_at, updated_at
) values (
    'sp-002', 'Akdeniz Elektrik Bakim', 'Selin Akdeniz', 'selin@akdenizelektrik.test', '+90 532 000 00 02',
    'Kocaeli', 'VERIFIED', false, 4.35, 78, now(), now()
) on conflict (id) do nothing;

insert into service_provider_specialties (provider_id, specialty) values
    ('sp-001', 'HYDRAULIC'),
    ('sp-001', 'PNEUMATIC'),
    ('sp-001', 'MECHANIC'),
    ('sp-002', 'ELECTRIC'),
    ('sp-002', 'SOFTWARE')
on conflict do nothing;

insert into tickets (
    id, customer_id, customer_name, customer_company, customer_location, asset_id, title, description,
    category, priority, status, sla_target_minutes, assigned_provider_id, assigned_provider_name, service_eta,
    final_estimated_cost, final_actual_cost, final_billing_notes, billing_status, created_at, updated_at
) values (
    'ticket-001', 'cust-001', 'Rodi Ugurlu', 'Ztemizinden Demo', 'Istanbul, Tuzla', 'asset-001',
    'Kompresor ilk calismada basinc dusuruyor',
    'Sabah vardiyasinda basinc 4 bar altina dusuyor, hatta dalgalanma oluyor.',
    'PNEUMATIC', 'HIGH', 'OPEN', 120, null, null, null, null, null, null, null, now() - interval '2 hours', now() - interval '2 hours'
) on conflict (id) do nothing;

insert into tickets (
    id, customer_id, customer_name, customer_company, customer_location, asset_id, title, description,
    category, priority, status, sla_target_minutes, assigned_provider_id, assigned_provider_name, service_eta,
    final_estimated_cost, final_actual_cost, final_billing_notes, billing_status, created_at, updated_at
) values (
    'ticket-002', 'cust-001', 'Rodi Ugurlu', 'Ztemizinden Demo', 'Istanbul, Tuzla', 'asset-002',
    'Pres silindirinde yag kacagi',
    'Ana silindir civatasinda yaglanma ve basinc kaybi gozleniyor.',
    'HYDRAULIC', 'CRITICAL', 'OFFERED', 45, null, null, null, null, null, null, null, now() - interval '1 hour', now() - interval '45 minutes'
) on conflict (id) do nothing;

insert into ticket_offers (
    id, ticket_id, provider_id, provider_name, type, estimated_cost, eta, message, status, created_at, updated_at
) values (
    'offer-001', 'ticket-002', 'sp-001', 'Kaya Hidrolik Servis', 'FIXED_PRICE', 8500.00,
    'Bugun 16:30', 'Conta seti ve silindir kontrolu dahil net fiyat teklifidir.', 'PENDING',
    now() - interval '35 minutes', now() - interval '35 minutes'
) on conflict (id) do nothing;

insert into ticket_messages (
    id, ticket_id, sender_role, sender_name, body, created_at, updated_at
) values (
    'msg-001', 'ticket-002', 'system', 'Ztemizinden Operasyon',
    'Talep hidrolik servis havuzuna yonlendirildi.', now() - interval '40 minutes', now() - interval '40 minutes'
) on conflict (id) do nothing;
