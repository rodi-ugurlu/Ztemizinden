-- =====================================================
-- V4: Rich demo seed for presentation-ready MVP
-- Adds multiple assets, tickets in various states,
-- offers, providers, and messages.
-- =====================================================

-- =====================================================
-- ASSETS: Restore asset-002 and add 3 more
-- =====================================================

insert into assets (
    id, owner_id, name, tag_no, type, brand, model, serial_number, purchase_date,
    warranty_end_date, status, location, department, description, created_at, updated_at
) values (
    'asset-002', 'cust-001', 'Hidrolik Pres 120T', 'PRS-120', 'SME', 'Hursan',
    'HP-120', 'HP120-7781', date '2024-11-05', date '2026-11-05', 'ACTIVE',
    'Istanbul, Tuzla', 'Üretim', 'Ana üretim hattındaki hidrolik pres.', now() - interval '30 days', now() - interval '30 days'
) on conflict (id) do nothing;

insert into assets (
    id, owner_id, name, tag_no, type, brand, model, serial_number, purchase_date,
    warranty_end_date, status, location, department, description, created_at, updated_at
) values (
    'asset-003', 'cust-001', 'CNC Torna Tezgahı', 'CNC-001', 'FACILITY', 'Doosan',
    'Puma 2600SY', 'DS-2600-44912', date '2024-06-15', date '2026-06-15', 'ACTIVE',
    'Istanbul, Tuzla', 'CNC Atölyesi', '5 eksenli CNC torna tezgahı, hassas işleme için.', now() - interval '60 days', now() - interval '60 days'
) on conflict (id) do nothing;

insert into assets (
    id, owner_id, name, tag_no, type, brand, model, serial_number, purchase_date,
    warranty_end_date, status, location, department, description, created_at, updated_at
) values (
    'asset-004', 'cust-001', 'Klima Santrali', 'HVAC-01', 'FACILITY', 'Daikin',
    'RZQ250', 'DK-RZQ-88210', date '2025-01-20', date '2027-01-20', 'ACTIVE',
    'Istanbul, Tuzla', 'Tesis Yönetimi', 'Ana fabrika binasının merkezi klima santrali.', now() - interval '45 days', now() - interval '45 days'
) on conflict (id) do nothing;

insert into assets (
    id, owner_id, name, tag_no, type, brand, model, serial_number, purchase_date,
    warranty_end_date, status, location, department, description, created_at, updated_at
) values (
    'asset-005', 'cust-001', 'PLC Kontrol Panosu', 'PLC-M01', 'FACILITY', 'Siemens',
    'S7-1500', 'SM-S7-2025-0041', date '2025-03-01', date '2026-09-01', 'ACTIVE',
    'Istanbul, Tuzla', 'Otomasyon', 'Ana hat PLC kontrol panosu, 64 I/O modülü.', now() - interval '20 days', now() - interval '20 days'
) on conflict (id) do nothing;

-- =====================================================
-- SERVICE PROVIDERS: Restore sp-002 and add sp-003
-- =====================================================

insert into service_providers (
    id, name, contact_name, email, phone, city, status, trusted, rating, completed_jobs, created_at, updated_at
) values (
    'sp-002', 'Akdeniz Elektrik Bakım', 'Selin Akdeniz', 'selin@akdenizelektrik.test', '+90 532 000 00 02',
    'Kocaeli', 'VERIFIED', false, 4.35, 78, now() - interval '90 days', now() - interval '5 days'
) on conflict (id) do nothing;

insert into service_providers (
    id, name, contact_name, email, phone, city, status, trusted, rating, completed_jobs, created_at, updated_at
) values (
    'sp-003', 'Marmara Otomasyon', 'Burak Yılmaz', 'burak@marmaraotomasyon.test', '+90 533 000 00 03',
    'Istanbul', 'VERIFIED', true, 4.92, 210, now() - interval '120 days', now() - interval '2 days'
) on conflict (id) do nothing;

-- Provider specialties
insert into service_provider_specialties (provider_id, specialty) values
    ('sp-001', 'HYDRAULIC'),
    ('sp-001', 'MECHANIC'),
    ('sp-002', 'ELECTRIC'),
    ('sp-002', 'SOFTWARE'),
    ('sp-003', 'SOFTWARE'),
    ('sp-003', 'ELECTRIC'),
    ('sp-003', 'PNEUMATIC')
on conflict do nothing;

-- =====================================================
-- TICKET 2: OPEN status (yeni açılmış, teklif yok)
-- =====================================================

insert into tickets (
    id, customer_id, customer_name, customer_company, customer_location, asset_id, title, description,
    category, priority, status, sla_target_minutes, created_at, updated_at
) values (
    'ticket-002', 'cust-001', 'Rodi Uğurlu', 'Ztemizinden Demo', 'Istanbul, Tuzla', 'asset-003',
    'CNC tezgah X ekseninde titreşim artışı',
    'Son 3 gündür X ekseninde yüksek frekanslı titreşim gözleniyor. Yüzey kalitesi düştü, tolerans dışı parça oranı %8 arttı.',
    'MECHANIC', 'HIGH', 'OPEN', 120, now() - interval '3 hours', now() - interval '3 hours'
) on conflict (id) do nothing;

insert into ticket_messages (
    id, ticket_id, sender_role, sender_name, body, created_at, updated_at
) values (
    'msg-002', 'ticket-002', 'system', 'Ztemizinden Operasyon',
    'Talep mekanik servis havuzuna yönlendirildi.', now() - interval '3 hours', now() - interval '3 hours'
) on conflict (id) do nothing;

-- =====================================================
-- TICKET 3: OFFERED status (2 teklif bekliyor)
-- =====================================================

insert into tickets (
    id, customer_id, customer_name, customer_company, customer_location, asset_id, title, description,
    category, priority, status, sla_target_minutes, created_at, updated_at
) values (
    'ticket-003', 'cust-001', 'Rodi Uğurlu', 'Ztemizinden Demo', 'Istanbul, Tuzla', 'asset-002',
    'Pres silindirinde yağ kaçağı',
    'Ana silindir civatası çevresinde yağlanma ve basınç kaybı gözleniyor. Pres çalışmaya devam ediyor ancak performans düşük.',
    'HYDRAULIC', 'CRITICAL', 'OFFERED', 45, now() - interval '5 hours', now() - interval '1 hour'
) on conflict (id) do nothing;

insert into ticket_offers (
    id, ticket_id, provider_id, provider_name, type, estimated_cost, eta, message, status, created_at, updated_at
) values (
    'offer-002', 'ticket-003', 'sp-001', 'Kaya Hidrolik Servis', 'FIXED_PRICE', 8500.00,
    'Bugün 16:30', 'Conta seti ve silindir kontrolü dahil net fiyat teklifidir. Parça stokta mevcut.', 'PENDING',
    now() - interval '2 hours', now() - interval '2 hours'
) on conflict (id) do nothing;

insert into ticket_offers (
    id, ticket_id, provider_id, provider_name, type, estimated_cost, eta, message, status, created_at, updated_at
) values (
    'offer-003', 'ticket-003', 'sp-003', 'Marmara Otomasyon', 'DISCOVERY', 2500.00,
    'Yarın 10:00', 'Önce yerinde keşif yaparak sorunun kapsamını belirleyip detaylı teklif sunabiliriz.', 'PENDING',
    now() - interval '1 hour', now() - interval '1 hour'
) on conflict (id) do nothing;

insert into ticket_messages (
    id, ticket_id, sender_role, sender_name, body, created_at, updated_at
) values (
    'msg-003', 'ticket-003', 'system', 'Ztemizinden Operasyon',
    'Talep hidrolik servis havuzuna yönlendirildi.', now() - interval '5 hours', now() - interval '5 hours'
) on conflict (id) do nothing;

insert into ticket_messages (
    id, ticket_id, sender_role, sender_name, body, created_at, updated_at
) values (
    'msg-004', 'ticket-003', 'customer', 'Rodi Uğurlu',
    'Kaçak giderek artıyor, mümkünse bugün içinde müdahale edilmesi gerekiyor.', now() - interval '4 hours', now() - interval '4 hours'
) on conflict (id) do nothing;

-- =====================================================
-- TICKET 4: IN_PROGRESS status (servis sahada)
-- =====================================================

insert into tickets (
    id, customer_id, customer_name, customer_company, customer_location, asset_id, title, description,
    category, priority, status, sla_target_minutes,
    assigned_provider_id, assigned_provider_name, service_eta,
    final_estimated_cost, created_at, updated_at
) values (
    'ticket-004', 'cust-001', 'Rodi Uğurlu', 'Ztemizinden Demo', 'Istanbul, Tuzla', 'asset-004',
    'Klima santrali soğutma kapasitesi düştü',
    'Son 1 haftadır bina iç sıcaklığı hedef değerin 4°C üzerinde. Kompresör devreye girip çıkıyor.',
    'MECHANIC', 'MEDIUM', 'IN_PROGRESS', 240,
    'sp-001', 'Kaya Hidrolik Servis', 'Bugün 14:00',
    12000.00, now() - interval '1 day', now() - interval '30 minutes'
) on conflict (id) do nothing;

-- Accepted offer for ticket-004
insert into ticket_offers (
    id, ticket_id, provider_id, provider_name, type, estimated_cost, eta, message, status, created_at, updated_at
) values (
    'offer-004', 'ticket-004', 'sp-001', 'Kaya Hidrolik Servis', 'FIXED_PRICE', 12000.00,
    'Bugün 14:00', 'Kompresör gaz dolumu ve filtre değişimi dahil. Referans gazla birlikte net fiyat.', 'ACCEPTED',
    now() - interval '20 hours', now() - interval '18 hours'
) on conflict (id) do nothing;

-- Update asset-004 status to UNDER_MAINTENANCE
update assets set status = 'UNDER_MAINTENANCE', updated_at = now() where id = 'asset-004';

insert into ticket_messages (
    id, ticket_id, sender_role, sender_name, body, created_at, updated_at
) values (
    'msg-005', 'ticket-004', 'system', 'Ztemizinden Operasyon',
    'Kaya Hidrolik Servis servisi davet edildi.', now() - interval '18 hours', now() - interval '18 hours'
) on conflict (id) do nothing;

insert into ticket_messages (
    id, ticket_id, sender_role, sender_name, body, created_at, updated_at
) values (
    'msg-006', 'ticket-004', 'customer', 'Rodi Uğurlu',
    'Teknisyen saat kaçta gelecek? Giriş için güvenliğe haber vermem gerekiyor.', now() - interval '16 hours', now() - interval '16 hours'
) on conflict (id) do nothing;

-- =====================================================
-- TICKET 5: RESOLVED + AWAITING_CUSTOMER_APPROVAL
-- =====================================================

insert into tickets (
    id, customer_id, customer_name, customer_company, customer_location, asset_id, title, description,
    category, priority, status, sla_target_minutes,
    assigned_provider_id, assigned_provider_name, service_eta,
    final_estimated_cost, final_actual_cost, final_billing_notes, billing_status,
    created_at, updated_at
) values (
    'ticket-005', 'cust-001', 'Rodi Uğurlu', 'Ztemizinden Demo', 'Istanbul, Tuzla', 'asset-005',
    'PLC haberleşme hatası – Profinet timeout',
    'S7-1500 ile HMI arasında aralıklı iletişim kopması. Hata kodu: FC 8192. Üretim hattı 2 kere durdu.',
    'SOFTWARE', 'CRITICAL', 'RESOLVED', 45,
    'sp-003', 'Marmara Otomasyon', 'Dün 09:00',
    5000.00, 4200.00, 'Profinet kablo ve konnektör değişimi yapıldı. Yazılımsal timeout parametreleri optimize edildi. Ek parça maliyeti tahmininden düşük geldi.', 'AWAITING_CUSTOMER_APPROVAL',
    now() - interval '2 days', now() - interval '4 hours'
) on conflict (id) do nothing;

-- Accepted offer for ticket-005
insert into ticket_offers (
    id, ticket_id, provider_id, provider_name, type, estimated_cost, eta, message, status, created_at, updated_at
) values (
    'offer-005', 'ticket-005', 'sp-003', 'Marmara Otomasyon', 'FIXED_PRICE', 5000.00,
    'Dün 09:00', 'Profinet diagnostik ve müdahale. Kablo/konnektör değişimi dahil.', 'ACCEPTED',
    now() - interval '2 days', now() - interval '2 days'
) on conflict (id) do nothing;

insert into ticket_messages (
    id, ticket_id, sender_role, sender_name, body, created_at, updated_at
) values (
    'msg-007', 'ticket-005', 'system', 'Ztemizinden Operasyon',
    'Marmara Otomasyon servisi davet edildi.', now() - interval '2 days', now() - interval '2 days'
) on conflict (id) do nothing;

insert into ticket_messages (
    id, ticket_id, sender_role, sender_name, body, created_at, updated_at
) values (
    'msg-008', 'ticket-005', 'system', 'Ztemizinden Operasyon',
    'Servis işi tamamlandı ve hak ediş onaya gönderildi.', now() - interval '4 hours', now() - interval '4 hours'
) on conflict (id) do nothing;
