-- Remove presentation seed content from V2-V6 so the product starts clean.
-- The local service account is kept only as an identity anchor for service@demo.com.

delete from provider_documents
where id in ('doc-sp001-tax', 'doc-sp001-trade', 'doc-sp001-cert')
   or provider_id in ('sp-002', 'sp-003');

delete from ticket_media_urls
where ticket_id in ('ticket-001', 'ticket-002', 'ticket-003', 'ticket-004', 'ticket-005', 'ticket-006', 'ticket-007');

delete from ticket_messages
where ticket_id in ('ticket-001', 'ticket-002', 'ticket-003', 'ticket-004', 'ticket-005', 'ticket-006', 'ticket-007')
   or id in ('msg-001', 'msg-002', 'msg-003', 'msg-004', 'msg-005', 'msg-006', 'msg-007', 'msg-008', 'msg-009', 'msg-010', 'msg-011');

delete from ticket_offers
where ticket_id in ('ticket-001', 'ticket-002', 'ticket-003', 'ticket-004', 'ticket-005', 'ticket-006', 'ticket-007')
   or provider_id in ('sp-002', 'sp-003')
   or id in ('offer-001', 'offer-002', 'offer-003', 'offer-004', 'offer-005', 'offer-006');

delete from tickets
where id in ('ticket-001', 'ticket-002', 'ticket-003', 'ticket-004', 'ticket-005', 'ticket-006', 'ticket-007');

delete from assets
where id in ('asset-001', 'asset-002', 'asset-003', 'asset-004', 'asset-005')
  and not exists (
      select 1
      from tickets
      where tickets.asset_id = assets.id
  );

delete from service_provider_specialties
where provider_id in ('sp-001', 'sp-002', 'sp-003');

delete from service_providers
where id in ('sp-002', 'sp-003');

update service_providers
set email = 'service@demo.com',
    name = 'Servis Saglayici',
    contact_name = 'Servis Yetkilisi',
    phone = '+90 532 000 00 00',
    city = 'Istanbul',
    status = 'VERIFIED',
    trusted = false,
    rating = 0,
    completed_jobs = 0,
    updated_at = now()
where id = 'sp-001'
  and not exists (
      select 1
      from service_providers
      where lower(email) = 'service@demo.com'
        and id <> 'sp-001'
  );

insert into service_provider_specialties (provider_id, specialty)
select 'sp-001', specialty
from (values
    ('ELECTRIC'),
    ('MECHANIC'),
    ('PNEUMATIC'),
    ('HYDRAULIC'),
    ('SOFTWARE'),
    ('GENERAL')
) as specialties(specialty)
where exists (select 1 from service_providers where id = 'sp-001')
on conflict do nothing;
