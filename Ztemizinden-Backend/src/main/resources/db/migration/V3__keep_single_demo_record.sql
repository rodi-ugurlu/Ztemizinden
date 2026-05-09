update tickets
set status = 'OFFERED',
    updated_at = now() - interval '45 minutes'
where id = 'ticket-001';

update ticket_offers
set ticket_id = 'ticket-001',
    message = 'Filtre ve basinc kontrolu dahil net fiyat teklifidir.',
    updated_at = now() - interval '35 minutes'
where id = 'offer-001';

update ticket_messages
set ticket_id = 'ticket-001',
    body = 'Talep pnomatik servis havuzuna yonlendirildi.',
    updated_at = now() - interval '40 minutes'
where id = 'msg-001';

delete from ticket_messages
where ticket_id <> 'ticket-001';

delete from ticket_offers
where ticket_id <> 'ticket-001';

delete from tickets
where id <> 'ticket-001';

delete from service_provider_specialties
where provider_id <> 'sp-001'
   or specialty <> 'PNEUMATIC';

delete from service_providers
where id <> 'sp-001';

delete from assets
where id <> 'asset-001';
