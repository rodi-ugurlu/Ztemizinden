export interface LandingProvider {
  name: string;
  logoUrl: string | null;
  city: string;
  primarySpecialty: string;
  trusted: boolean;
}

export interface RibbonEntry {
  name: string;
  logoUrl: string | null;
}

export interface LandingSnapshot {
  providers: LandingProvider[];
  ribbon: RibbonEntry[];
  stats: {
    verifiedProviderCount: number;
    servedCityCount: number;
    completedWorkOrderCount: number;
  };
  rotationDate: string;
}

export interface ShowcaseSlot {
  top: string;
  left: string;
  float: { dur: number; delay: number; ampY: number; ampX: number };
}

export const showcaseSlots: ShowcaseSlot[] = [
  { top: '18%', left: '52%', float: { dur: 22, delay: 0, ampY: 10, ampX: 7 } },
  { top: '16%', left: '77%', float: { dur: 26, delay: -4, ampY: 9, ampX: 10 } },
  { top: '43%', left: '64%', float: { dur: 20, delay: -8, ampY: 12, ampX: 6 } },
  { top: '67%', left: '80%', float: { dur: 28, delay: -2, ampY: 8, ampX: 9 } },
  { top: '73%', left: '52%', float: { dur: 24, delay: -6, ampY: 11, ampX: 7 } },
  { top: '39%', left: '46%', float: { dur: 30, delay: -10, ampY: 10, ampX: 8 } },
  { top: '40%', left: '83%', float: { dur: 18, delay: -12, ampY: 12, ampX: 5 } },
  { top: '64%', left: '65%', float: { dur: 24, delay: -3, ampY: 9, ampX: 8 } },
  { top: '84%', left: '69%', float: { dur: 27, delay: -7, ampY: 8, ampX: 10 } },
  { top: '7%', left: '65%', float: { dur: 21, delay: -5, ampY: 11, ampX: 6 } },
];

export const proofPoints = [
  { label: 'Canlı servis ağı', key: 'network' },
  { label: 'Doğrulanmış firmalar', key: 'verified' },
  { label: 'Hızlı yönlendirme', key: 'dispatch' },
];

export const howItWorks = [
  {
    step: '01',
    title: 'Bakım Talebi Oluşturun',
    desc: 'Tesisinizdeki arıza, periyodik bakım veya revizyon ihtiyacınızı Maintly üzerinden kaydedin. Varlık ağacınızdan doğru ekipmana bağlı talep açın.',
  },
  {
    step: '02',
    title: 'Doğru Ekip ile Eşleşin',
    desc: 'Talebiniz, yetkinliklerine, lokasyonlarına ve müsaitliklerine göre en uygun servis ekipleriyle otomatik olarak eşleştirilir.',
  },
  {
    step: '03',
    title: 'Süreci Görünür Yönetin',
    desc: 'Atama, on-site çalışma, raporlama ve kapanış tüm adımları tek ekrandan takip edin. Tarihçe ve dokümanlar otomatik arşivlenir.',
  },
];

export const forFactories = [
  'Varlık ağacı (asset tree) yönetimi',
  'Bakım talebi ve iş emri oluşturma',
  'Servis performansı takibi ve değerlendirme',
  'Maliyet raporlama ve bütçe planlama',
];

export const forServices = [
  'Gelen taleplere anlık yanıt ve teklif',
  'Saha ekibi atama ve rota optimizasyonu',
  'Mobil uyumlu iş emri yönetimi',
  'Fabrika/işletme portföyü ve sözleşme takibi',
];

export const footerLinks = {
  product: [
    { label: 'Nasıl Çalışır?', href: '#how-it-works' },
    { label: 'Fabrikalar İçin', href: '#for-whom' },
    { label: 'Servisler İçin', href: '#for-whom' },
    { label: 'Fiyatlandırma', href: '#' },
  ],
  company: [
    { label: 'Hakkımızda', href: '#' },
    { label: 'İletişim', href: '#' },
    { label: 'Kariyer', href: '#' },
    { label: 'Blog', href: '#' },
  ],
  legal: [
    { label: 'Kullanım Koşulları', href: '#' },
    { label: 'Gizlilik Politikası', href: '#' },
    { label: 'KVKK Aydınlatma', href: '#' },
  ],
};
