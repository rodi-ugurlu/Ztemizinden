create table ticket_media_urls (
    ticket_id varchar(255) not null references tickets(id) on delete cascade,
    media_url varchar(1000) not null
);

create index idx_ticket_media_urls_ticket on ticket_media_urls(ticket_id);

create table provider_documents (
    id varchar(255) primary key,
    provider_id varchar(255) not null references service_providers(id) on delete cascade,
    type varchar(255) not null,
    url varchar(1000) not null,
    original_file_name varchar(255) not null,
    status varchar(50) not null,
    verified_date timestamptz,
    notes varchar(2000),
    created_at timestamptz not null,
    updated_at timestamptz not null
);

create index idx_provider_documents_provider on provider_documents(provider_id);

insert into provider_documents (
    id, provider_id, type, url, original_file_name, status, verified_date, notes, created_at, updated_at
) values
    ('doc-sp001-tax', 'sp-001', 'Vergi Levhasi', '/uploads/provider-documents/demo-vergi-levhasi.pdf', 'demo-vergi-levhasi.pdf', 'VERIFIED', now() - interval '20 days', 'Demo beta belgesi.', now() - interval '30 days', now() - interval '20 days'),
    ('doc-sp001-trade', 'sp-001', 'Ticaret Sicil', '/uploads/provider-documents/demo-ticaret-sicil.pdf', 'demo-ticaret-sicil.pdf', 'VERIFIED', now() - interval '20 days', 'Demo beta belgesi.', now() - interval '30 days', now() - interval '20 days'),
    ('doc-sp001-cert', 'sp-001', 'Yetkinlik Belgesi', '/uploads/provider-documents/demo-yetkinlik.pdf', 'demo-yetkinlik.pdf', 'VERIFIED', now() - interval '20 days', 'Demo beta belgesi.', now() - interval '30 days', now() - interval '20 days')
on conflict (id) do nothing;
