update service_providers
set landing_visibility = 'VISIBLE',
    landing_approved_at = coalesce(landing_approved_at, created_at, current_timestamp)
where status = 'VERIFIED'
  and landing_visibility = 'HIDDEN';

drop index if exists idx_service_providers_landing_showcase;

create index if not exists idx_service_providers_landing_showcase
    on service_providers (status, landing_visibility, created_at, id);
