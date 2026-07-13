alter table service_providers
    add column if not exists landing_visibility varchar(20) not null default 'HIDDEN',
    add column if not exists landing_approved_at timestamptz;

create index if not exists idx_service_providers_landing_showcase
    on service_providers (status, landing_visibility, created_at, id)
    where logo_url like '/uploads/profile-logos/%';
