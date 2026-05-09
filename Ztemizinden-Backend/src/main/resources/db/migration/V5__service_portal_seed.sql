-- =====================================================
-- V5: Additional demo seed for Service Provider Portal
-- Ensures sp-001 has visible data in all kanban columns
-- =====================================================

-- Ticket for sp-001 opportunities: OPEN ticket matching sp-001 specialties (HYDRAULIC, MECHANIC, PNEUMATIC)
-- ticket-001 is already OFFERED with sp-001 offer (from V3) — shows in "Tekliflerim"
-- ticket-002 is OPEN MECHANIC (from V4) — shows in "Yeni Fırsatlar"
-- ticket-003 is OFFERED HYDRAULIC (from V4) — shows in "Yeni Fırsatlar" (sp-001 hasn't offered yet)
-- ticket-004 is IN_PROGRESS assigned to sp-001 (from V4) — shows in "Aktif İşler"

-- Add a RESOLVED+CLOSED ticket assigned to sp-001 for completed history
insert into tickets (
    id, customer_id, customer_name, customer_company, customer_location, asset_id, title, description,
    category, priority, status, sla_target_minutes,
    assigned_provider_id, assigned_provider_name, service_eta,
    final_estimated_cost, final_actual_cost, final_billing_notes, billing_status,
    created_at, updated_at
) values (
    'ticket-006', 'cust-001', 'Rodi Uğurlu', 'Ztemizinden Demo', 'Istanbul, Tuzla', 'asset-001',
    'Kompresör filtre değişimi ve bakım',
    'Yıllık periyodik bakım kapsamında filtre değişimi ve genel kontrol.',
    'PNEUMATIC', 'LOW', 'CLOSED', 480,
    'sp-001', 'Kaya Hidrolik Servis', 'Geçen hafta',
    3500.00, 3200.00, 'Filtre seti ve yağ değişimi yapıldı. Sistem basınç testi başarılı.', 'APPROVED',
    now() - interval '7 days', now() - interval '5 days'
) on conflict (id) do nothing;

insert into ticket_offers (
    id, ticket_id, provider_id, provider_name, type, estimated_cost, eta, message, status, created_at, updated_at
) values (
    'offer-006', 'ticket-006', 'sp-001', 'Kaya Hidrolik Servis', 'FIXED_PRICE', 3500.00,
    'Geçen hafta', 'Yıllık bakım paketi dahilinde filtre ve yağ değişimi.', 'ACCEPTED',
    now() - interval '7 days', now() - interval '7 days'
) on conflict (id) do nothing;

insert into ticket_messages (
    id, ticket_id, sender_role, sender_name, body, created_at, updated_at
) values (
    'msg-009', 'ticket-006', 'system', 'Ztemizinden Operasyon',
    'Periyodik bakım talebi oluşturuldu.', now() - interval '7 days', now() - interval '7 days'
) on conflict (id) do nothing;

insert into ticket_messages (
    id, ticket_id, sender_role, sender_name, body, created_at, updated_at
) values (
    'msg-010', 'ticket-006', 'system', 'Ztemizinden Operasyon',
    'İş tamamlandı. Hakediş onaylandı.', now() - interval '5 days', now() - interval '5 days'
) on conflict (id) do nothing;

-- Add another OPEN ticket in MECHANIC category for more opportunities
insert into tickets (
    id, customer_id, customer_name, customer_company, customer_location, asset_id, title, description,
    category, priority, status, sla_target_minutes, created_at, updated_at
) values (
    'ticket-007', 'cust-001', 'Rodi Uğurlu', 'Ztemizinden Demo', 'Istanbul, Tuzla', 'asset-002',
    'Hidrolik pres basınç regülatörü ayarı',
    'Basınç regülatörü ayar dışı çalışıyor. Makine nominal basınca ulaşamıyor.',
    'HYDRAULIC', 'MEDIUM', 'OPEN', 180, now() - interval '1 hour', now() - interval '1 hour'
) on conflict (id) do nothing;

insert into ticket_messages (
    id, ticket_id, sender_role, sender_name, body, created_at, updated_at
) values (
    'msg-011', 'ticket-007', 'system', 'Ztemizinden Operasyon',
    'Talep hidrolik servis havuzuna yönlendirildi.', now() - interval '1 hour', now() - interval '1 hour'
) on conflict (id) do nothing;
