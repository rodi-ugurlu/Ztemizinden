package com.iknow.ztemizindenbackend.application;

import com.iknow.ztemizindenbackend.domain.Asset;
import com.iknow.ztemizindenbackend.domain.AssetRepository;
import com.iknow.ztemizindenbackend.domain.Customer;
import com.iknow.ztemizindenbackend.domain.CustomerRepository;
import com.iknow.ztemizindenbackend.domain.Enums.AssetType;
import com.iknow.ztemizindenbackend.domain.Enums.OfferType;
import com.iknow.ztemizindenbackend.domain.Enums.TicketCategory;
import com.iknow.ztemizindenbackend.domain.Enums.TicketPriority;
import com.iknow.ztemizindenbackend.domain.ServiceProvider;
import com.iknow.ztemizindenbackend.domain.ServiceProviderRepository;
import com.iknow.ztemizindenbackend.domain.Ticket;
import com.iknow.ztemizindenbackend.domain.TicketOffer;
import com.iknow.ztemizindenbackend.domain.TicketRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class DemoAccountProvisioner implements ApplicationRunner {
    private static final String CUSTOMER_ID = "cust-001";
    private static final String CUSTOMER_EMAIL = "customer@demo.com";

    private static final String PROVIDER_ID = "sp-001";
    private static final String PROVIDER_EMAIL = "service@demo.com";

    private final CustomerRepository customerRepository;
    private final ServiceProviderRepository serviceProviderRepository;
    private final AssetRepository assetRepository;
    private final TicketRepository ticketRepository;

    @Value("${app.demo-data.ensure-demo-accounts:false}")
    private boolean ensureDemoAccounts;

    @Value("${app.demo-data.reset-and-seed:false}")
    private boolean resetAndSeed;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (resetAndSeed) {
            resetAndSeedPresentationData();
            return;
        }

        if (ensureDemoAccounts) {
            provisionLegacyDemoAccounts();
        }
    }

    private void resetAndSeedPresentationData() {
        log.warn("APP_DEMO_RESET_AND_SEED is enabled. Clearing operational data and creating presentation seed data.");
        clearOperationalData();

        Customer alfa = saveCustomer(
                "Ayşe Demir",
                CUSTOMER_EMAIL,
                "+90 532 000 00 10",
                "Ztemizinden Demo Fabrika",
                "Istanbul",
                "Kadıköy",
                "Istanbul, Kadıköy OSB, Bakım Müdürlüğü",
                "1111111111"
        );
        Customer beta = saveCustomer(
                "Mert Yılmaz",
                "customer2@demo.com",
                "+90 532 000 00 20",
                "Beta Gıda Üretim",
                "Istanbul",
                "Ataşehir",
                "Istanbul, Ataşehir, Üretim Tesisi",
                "2222222222"
        );
        Customer gamma = saveCustomer(
                "Selin Aksoy",
                "customer3@demo.com",
                "+90 532 000 00 30",
                "Anadolu İlaç Sanayi",
                "Istanbul",
                "Ümraniye",
                "Istanbul, Ümraniye, Temiz Oda Tesisi",
                "3333333333"
        );

        ServiceProvider hidro = saveProvider(
                PROVIDER_EMAIL,
                "HidroTek Endüstriyel Servis",
                "Can Hidro",
                "+90 532 100 10 10",
                "Kadıköy",
                Set.of(TicketCategory.HYDRAULIC, TicketCategory.PNEUMATIC),
                Set.of("vana", "pompa", "hidrofor", "aktuatör", "basınç transmitter"),
                Set.of("Kadıköy", "Ataşehir", "Üsküdar", "Ümraniye")
        );
        ServiceProvider elektrik = saveProvider(
                "service2@demo.com",
                "Elektron Bakım ve Otomasyon",
                "Ece Elektrik",
                "+90 532 100 20 20",
                "Ataşehir",
                Set.of(TicketCategory.ELECTRIC, TicketCategory.SOFTWARE),
                Set.of("pano", "pt100", "inverter", "otomasyon", "hmi", "sensör"),
                Set.of("Ataşehir", "Kadıköy", "Maltepe", "Ümraniye")
        );
        ServiceProvider mekanik = saveProvider(
                "service3@demo.com",
                "Mekanix Saha Servis",
                "Bora Mekanik",
                "+90 532 100 30 30",
                "Ümraniye",
                Set.of(TicketCategory.MECHANIC, TicketCategory.GENERAL),
                Set.of("rulman", "redüktör", "konveyör", "salmastra", "mil"),
                Set.of("Ümraniye", "Ataşehir", "Çekmeköy", "Kadıköy")
        );
        ServiceProvider pnomatik = saveProvider(
                "service4@demo.com",
                "Pnömatik Pro Teknik",
                "Deniz Basınç",
                "+90 532 100 40 40",
                "Maltepe",
                Set.of(TicketCategory.PNEUMATIC, TicketCategory.MECHANIC),
                Set.of("kompresör", "basınçlı hava", "valf", "fitting", "filtre"),
                Set.of("Maltepe", "Kadıköy", "Kartal", "Ataşehir")
        );
        ServiceProvider tesis = saveProvider(
                "service5@demo.com",
                "Tesis360 Bakım",
                "Naz Tesis",
                "+90 532 100 50 50",
                "Üsküdar",
                Set.of(TicketCategory.GENERAL, TicketCategory.ELECTRIC, TicketCategory.HYDRAULIC),
                Set.of("filtre", "tesisat", "yangın pompaları", "su şartlandırma", "hidrofor"),
                Set.of("Üsküdar", "Kadıköy", "Beykoz", "Ataşehir")
        );

        Asset vanaHatti = saveAsset(alfa, "Boşaltma Vanası Hattı", "ZT-VANA-001", "KSB", "DN50 Piston Vana", "SN-VANA-001", "Üretim A Blok", "Proses Hattı");
        Asset paketlemePano = saveAsset(alfa, "Paketleme Hattı Elektrik Panosu", "ZT-PANO-014", "Siemens", "S7-1200 Pano", "SN-PANO-014", "Paketleme", "Elektrik");
        Asset konveyor = saveAsset(beta, "Redüktörlü Konveyör", "BG-CONV-220", "SEW", "R47", "SN-CONV-220", "Dolum Hattı", "Mekanik");
        Asset kompresor = saveAsset(beta, "Kompresör Dairesi", "BG-KOMP-050", "Atlas Copco", "GA37", "SN-KOMP-050", "Enerji Merkezi", "Pnömatik");
        Asset hmiPanel = saveAsset(gamma, "HMI Reçete Paneli", "AI-HMI-018", "Schneider", "Magelis", "SN-HMI-018", "Temiz Oda 2", "Otomasyon");
        Asset sogutmaPompa = saveAsset(gamma, "Soğutma Pompa Grubu", "AI-PMP-077", "Grundfos", "CRN", "SN-PMP-077", "Utility", "Hidrolik");

        createOfferedTicket(
                alfa,
                vanaHatti,
                "Ölçüm yapmadan elektrik bağlantıları zarar görmüş",
                "Boşaltma vanasında piston hareketi takılıyor. Hat durmadan önce servis değerlendirmesi gerekiyor.",
                TicketCategory.HYDRAULIC,
                TicketPriority.HIGH,
                List.of(
                        offer(hidro, OfferType.FIXED_PRICE, 18_500, "Bugün 15:00", "Vana aktuatörü ve basınç hattını yerinde kontrol eder, aynı gün müdahale ederiz."),
                        offer(tesis, OfferType.DISCOVERY, 0, "Yarın 10:00", "Ön keşif sonrası net parça ihtiyacını bildiririz.")
                ),
                List.of("Üretim hattı 16:00 vardiyasına kadar açık kalacak, dönüşünüz acil.")
        );

        createAcceptedTicket(
                alfa,
                paketlemePano,
                "PT100 sensör okuması dalgalanıyor",
                "Paketleme hattında sıcaklık ölçümü dalgalanıyor, pano üzerinde alarm tekrarlıyor.",
                TicketCategory.ELECTRIC,
                TicketPriority.CRITICAL,
                elektrik,
                OfferType.FIXED_PRICE,
                12_750,
                "45 dk",
                "PT100, klemens ve analog giriş kanalını kontrol edip kalibrasyon yapacağız.",
                List.of(
                        service("Yola çıktık, panoya müdahale etmeden önce enerjiyi birlikte keseceğiz."),
                        customer("Operatör arkadaşlar hazır, kapı girişinde güvenliğe bilgi verdik.")
                )
        );

        createBillingTicket(
                beta,
                konveyor,
                "Konveyör redüktöründe rulman sesi",
                "Dolum hattındaki redüktörde yüksek ses ve titreşim var. Planlı duruş içinde tamamlanması gerekiyor.",
                TicketCategory.MECHANIC,
                TicketPriority.MEDIUM,
                mekanik,
                24_000,
                27_500,
                "Rulman, keçe ve yağ değişimi tamamlandı. Mil yatak toleransı kontrol edildi.",
                false
        );

        createOpenTicket(
                beta,
                kompresor,
                "Kompresör basıncı vardiya içinde düşüyor",
                "Basınçlı hava hattı 6 bar altına düşüyor. Kaçak veya filtre tıkanıklığı şüphesi var.",
                TicketCategory.PNEUMATIC,
                TicketPriority.HIGH,
                List.of("Kompresör dairesi 24 saat açık, gece vardiyasında da müdahale kabul edilir.")
        );

        createOfferedTicket(
                gamma,
                hmiPanel,
                "HMI reçete ekranı donuyor",
                "Temiz oda üretiminde reçete seçimi sırasında panel kilitleniyor, operatör yeniden başlatmak zorunda kalıyor.",
                TicketCategory.SOFTWARE,
                TicketPriority.MEDIUM,
                List.of(
                        offer(elektrik, OfferType.DISCOVERY, 0, "Bugün 17:30", "HMI logları ve PLC haberleşmesini yerinde kontrol edelim.")
                ),
                List.of("Paneldeki hata ekran görüntülerini ekibe hazırladık.")
        );

        createOpenTicket(
                gamma,
                sogutmaPompa,
                "Soğutma pompasında debi düşüşü",
                "CRN pompa debisi son iki vardiyada düştü. Eşanjör beslemesi kritik seviyede.",
                TicketCategory.HYDRAULIC,
                TicketPriority.CRITICAL,
                List.of("Pompa yedekli çalışıyor ama ikinci pompa da alarm üretiyor.")
        );

        createBillingTicket(
                beta,
                kompresor,
                "Kompresör bakım ve filtre değişimi",
                "Aylık bakım kapsamında filtre, yağ ve kaçak kontrolü talep edildi.",
                TicketCategory.PNEUMATIC,
                TicketPriority.LOW,
                pnomatik,
                9_000,
                9_000,
                "Filtre değişimi ve kaçak kontrolü tamamlandı. Hat basıncı stabil.",
                true
        );

    }

    private void clearOperationalData() {
        ticketRepository.deleteAll();
        assetRepository.deleteAll();
        customerRepository.deleteAll();
        serviceProviderRepository.deleteAll();

        ticketRepository.flush();
        assetRepository.flush();
        customerRepository.flush();
        serviceProviderRepository.flush();
    }

    private void provisionLegacyDemoAccounts() {
        Customer customer = ensureDemoCustomer();
        ServiceProvider provider = ensureDemoProvider();

    }

    private Customer ensureDemoCustomer() {
        Customer customer = customerRepository.findByEmailIgnoreCase(CUSTOMER_EMAIL)
                .or(() -> customerRepository.findById(CUSTOMER_ID))
                .orElseGet(this::createDemoCustomer);
        customer.activate();
        return customerRepository.save(customer);
    }

    private Customer createDemoCustomer() {
        return saveCustomer(
                "Rodi Ugurlu",
                CUSTOMER_EMAIL,
                "+90 532 000 00 10",
                "Ztemizinden Demo",
                "Istanbul",
                "Kadıköy",
                "Istanbul, Turkiye",
                "1111111111"
        );
    }

    private ServiceProvider ensureDemoProvider() {
        ServiceProvider provider = serviceProviderRepository.findByEmailIgnoreCase(PROVIDER_EMAIL)
                .or(() -> serviceProviderRepository.findById(PROVIDER_ID))
                .orElseGet(this::createDemoProvider);
        provider.verify();
        return serviceProviderRepository.save(provider);
    }

    private ServiceProvider createDemoProvider() {
        return saveProvider(
                PROVIDER_EMAIL,
                "Servis Saglayici",
                "Servis Yetkilisi",
                "+90 532 000 00 00",
                "Kadıköy",
                Set.of(
                        TicketCategory.ELECTRIC,
                        TicketCategory.MECHANIC,
                        TicketCategory.PNEUMATIC,
                        TicketCategory.HYDRAULIC,
                        TicketCategory.SOFTWARE,
                        TicketCategory.GENERAL
                ),
                Set.of("hvac", "otomasyon", "rulman", "vana", "pt100", "motor", "elektrik", "hidrofor", "pompa", "inverter", "kompresör", "filtre"),
                Set.of("Kadıköy", "Ataşehir", "Üsküdar", "Ümraniye", "Maltepe")
        );
    }

    private Customer saveCustomer(
            String contactName,
            String email,
            String phone,
            String companyName,
            String city,
            String district,
            String address,
            String taxNumber
    ) {
        Customer customer = new Customer(contactName, email, phone, companyName, city, district);
        customer.updateProfile(contactName, companyName, phone, city, district, address, taxNumber, null);
        customer.activate();
        return customerRepository.save(customer);
    }

    private ServiceProvider saveProvider(
            String email,
            String companyName,
            String contactName,
            String phone,
            String district,
            Set<TicketCategory> specialties,
            Set<String> expertiseTags,
            Set<String> coverageDistricts
    ) {
        ServiceProvider provider = new ServiceProvider(
                companyName,
                contactName,
                email,
                phone,
                "Istanbul",
                district,
                specialties,
                expertiseTags,
                coverageDistricts
        );
        provider.updateProfile(
                companyName,
                contactName,
                phone,
                "Istanbul",
                district,
                "Istanbul, " + district + " servis merkezi",
                "99" + Math.abs(email.hashCode() % 10_000_000),
                null,
                specialties,
                expertiseTags,
                coverageDistricts
        );
        provider.addDocument("Yetkinlik Belgesi", "/uploads/provider-documents/demo-yetkinlik.pdf", "demo-yetkinlik.pdf");
        provider.addDocument("Vergi Levhası", "/uploads/provider-documents/demo-vergi-levhasi.pdf", "demo-vergi-levhasi.pdf");
        ServiceProvider savedProvider = serviceProviderRepository.saveAndFlush(provider);
        savedProvider.getDocuments().forEach(document -> savedProvider.verifyDocument(document.getId(), "Sunum demosu için doğrulandı."));
        savedProvider.verify();
        return serviceProviderRepository.save(savedProvider);
    }

    private Asset saveAsset(
            Customer customer,
            String name,
            String tagNo,
            String brand,
            String model,
            String serialNumber,
            String location,
            String department
    ) {
        Asset asset = new Asset(
                customer.getId(),
                name,
                tagNo,
                AssetType.FACILITY,
                brand,
                model,
                serialNumber,
                LocalDate.now().minusYears(2),
                LocalDate.now().plusMonths(9),
                location,
                department,
                "Sunum demo varlığı"
        );
        return assetRepository.save(asset);
    }

    private Ticket createOpenTicket(
            Customer customer,
            Asset asset,
            String title,
            String description,
            TicketCategory category,
            TicketPriority priority,
            List<String> customerMessages
    ) {
        Ticket ticket = newTicket(customer, asset, title, description, category, priority);
        customerMessages.forEach(ticket::addCustomerMessage);
        return ticketRepository.save(ticket);
    }

    private Ticket createOfferedTicket(
            Customer customer,
            Asset asset,
            String title,
            String description,
            TicketCategory category,
            TicketPriority priority,
            List<OfferSeed> offers,
            List<String> customerMessages
    ) {
        Ticket ticket = newTicket(customer, asset, title, description, category, priority);
        offers.forEach(offer -> ticket.addOffer(
                offer.provider().getId(),
                offer.provider().getName(),
                offer.type(),
                BigDecimal.valueOf(offer.estimatedCost()),
                offer.eta(),
                offer.message()
        ));
        customerMessages.forEach(ticket::addCustomerMessage);
        return ticketRepository.save(ticket);
    }

    private Ticket createAcceptedTicket(
            Customer customer,
            Asset asset,
            String title,
            String description,
            TicketCategory category,
            TicketPriority priority,
            ServiceProvider provider,
            OfferType type,
            int estimatedCost,
            String eta,
            String offerMessage,
            List<MessageSeed> messages
    ) {
        Ticket ticket = newTicket(customer, asset, title, description, category, priority);
        TicketOffer offer = ticket.addOffer(provider.getId(), provider.getName(), type, BigDecimal.valueOf(estimatedCost), eta, offerMessage);
        ticket = ticketRepository.saveAndFlush(ticket);
        ticket.acceptOffer(offer.getId());
        for (MessageSeed message : messages) {
            addMessage(ticket, message);
        }
        return ticketRepository.save(ticket);
    }

    private Ticket createBillingTicket(
            Customer customer,
            Asset asset,
            String title,
            String description,
            TicketCategory category,
            TicketPriority priority,
            ServiceProvider provider,
            int estimatedCost,
            int actualCost,
            String billingNotes,
            boolean approved
    ) {
        Ticket ticket = createAcceptedTicket(
                customer,
                asset,
                title,
                description,
                category,
                priority,
                provider,
                OfferType.FIXED_PRICE,
                estimatedCost,
                "Bugün içinde",
                "Planlı duruş içinde işi tamamlarız.",
                List.of(service("Saha çalışmasını tamamladık, hakedişi iletiyoruz."))
        );
        ticket.submitFinalBilling(BigDecimal.valueOf(actualCost), billingNotes);
        if (approved) {
            ticket.approveFinalBilling();
        }
        return ticketRepository.save(ticket);
    }

    private Ticket newTicket(
            Customer customer,
            Asset asset,
            String title,
            String description,
            TicketCategory category,
            TicketPriority priority
    ) {
        return new Ticket(
                customer.getId(),
                customer.getName(),
                customer.getCompanyName(),
                customer.getCity() + ", " + customer.getDistrict(),
                customer.getCity(),
                customer.getDistrict(),
                customer.getAddress(),
                asset,
                title,
                description,
                category,
                priority,
                List.of()
        );
    }

    private void addMessage(Ticket ticket, MessageSeed message) {
        if ("service".equals(message.role())) {
            ticket.addServiceMessage(ticket.getAssignedProviderName(), message.body());
            return;
        }
        ticket.addCustomerMessage(message.body());
    }

    private OfferSeed offer(ServiceProvider provider, OfferType type, int estimatedCost, String eta, String message) {
        return new OfferSeed(provider, type, estimatedCost, eta, message);
    }

    private MessageSeed customer(String body) {
        return new MessageSeed("customer", body);
    }

    private MessageSeed service(String body) {
        return new MessageSeed("service", body);
    }

    private record OfferSeed(ServiceProvider provider, OfferType type, int estimatedCost, String eta, String message) {
    }

    private record MessageSeed(String role, String body) {
    }
}
