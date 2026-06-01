export type CompanyType = 'Fabrika' | 'Servis' | 'Tesis' | 'Atölye';

export interface NetworkNode {
  id: string;
  name: string;
  type: CompanyType;
  city: string;
  initials: string;
  tone: string;
  position: { top: string; left: string };
  float: { dur: number; delay: number; ampY: number; ampX: number };
}

export const factoryNodes: NetworkNode[] = [
  { id: 'f1', name: 'Marmara Makina', type: 'Fabrika', city: 'Kocaeli', initials: 'MM', tone: 'bg-red-500 text-white', position: { top: '14%', left: '48%' }, float: { dur: 22, delay: 0, ampY: 14, ampX: 8 } },
  { id: 'f2', name: 'Ege Döküm', type: 'Tesis', city: 'İzmir', initials: 'ED', tone: 'bg-zinc-100 text-zinc-950', position: { top: '32%', left: '54%' }, float: { dur: 26, delay: -4, ampY: 12, ampX: 10 } },
  { id: 'f3', name: 'Anka Gıda', type: 'Fabrika', city: 'Konya', initials: 'AG', tone: 'bg-emerald-400 text-zinc-950', position: { top: '52%', left: '50%' }, float: { dur: 20, delay: -8, ampY: 16, ampX: 6 } },
  { id: 'f4', name: 'Bursa Tekstil', type: 'Tesis', city: 'Bursa', initials: 'BT', tone: 'bg-cyan-300 text-zinc-950', position: { top: '70%', left: '58%' }, float: { dur: 28, delay: -2, ampY: 10, ampX: 12 } },
  { id: 'f5', name: 'Tuzla Kimya', type: 'Fabrika', city: 'İstanbul', initials: 'TK', tone: 'bg-amber-300 text-zinc-950', position: { top: '24%', left: '42%' }, float: { dur: 24, delay: -6, ampY: 12, ampX: 8 } },
  { id: 'f6', name: 'Delta Ambalaj', type: 'Atölye', city: 'Sakarya', initials: 'DA', tone: 'bg-rose-500 text-white', position: { top: '62%', left: '44%' }, float: { dur: 30, delay: -10, ampY: 14, ampX: 10 } },
  { id: 'f7', name: 'Vega Otomasyon', type: 'Tesis', city: 'Bursa', initials: 'VO', tone: 'bg-teal-300 text-zinc-950', position: { top: '44%', left: '60%' }, float: { dur: 18, delay: -12, ampY: 18, ampX: 6 } },
  { id: 'f8', name: 'Kuzey Plastik', type: 'Fabrika', city: 'Gebze', initials: 'KP', tone: 'bg-orange-400 text-zinc-950', position: { top: '78%', left: '50%' }, float: { dur: 24, delay: -3, ampY: 12, ampX: 8 } },
];

export const serviceNodes: NetworkNode[] = [
  { id: 's1', name: 'FocusOpex Servis', type: 'Servis', city: 'İstanbul', initials: 'FO', tone: 'bg-zinc-950 text-white border border-white/20', position: { top: '18%', left: '76%' }, float: { dur: 20, delay: -5, ampY: 12, ampX: 10 } },
  { id: 's2', name: 'Atlas Bakım', type: 'Servis', city: 'Kocaeli', initials: 'AB', tone: 'bg-red-500 text-white', position: { top: '36%', left: '72%' }, float: { dur: 26, delay: -9, ampY: 14, ampX: 8 } },
  { id: 's3', name: 'Nova Mekanik', type: 'Servis', city: 'Bursa', initials: 'NM', tone: 'bg-teal-300 text-zinc-950', position: { top: '56%', left: '78%' }, float: { dur: 22, delay: -1, ampY: 10, ampX: 12 } },
  { id: 's4', name: 'Volta Elektrik', type: 'Servis', city: 'Ankara', initials: 'VE', tone: 'bg-yellow-300 text-zinc-950', position: { top: '74%', left: '70%' }, float: { dur: 28, delay: -7, ampY: 16, ampX: 6 } },
  { id: 's5', name: 'Hidroline', type: 'Servis', city: 'İzmir', initials: 'HL', tone: 'bg-blue-500 text-white', position: { top: '28%', left: '84%' }, float: { dur: 24, delay: -11, ampY: 12, ampX: 8 } },
  { id: 's6', name: 'Tekno Kompresör', type: 'Servis', city: 'Tekirdağ', initials: 'TK', tone: 'bg-orange-400 text-zinc-950', position: { top: '48%', left: '68%' }, float: { dur: 18, delay: -14, ampY: 14, ampX: 10 } },
  { id: 's7', name: 'Proses Teknik', type: 'Servis', city: 'Manisa', initials: 'PT', tone: 'bg-lime-300 text-zinc-950', position: { top: '64%', left: '84%' }, float: { dur: 30, delay: -3, ampY: 10, ampX: 12 } },
  { id: 's8', name: 'Rota Endüstri', type: 'Servis', city: 'Eskişehir', initials: 'RE', tone: 'bg-violet-400 text-white', position: { top: '84%', left: '76%' }, float: { dur: 22, delay: -6, ampY: 16, ampX: 8 } },
];

export const connections: { from: string; to: string }[] = [
  { from: 'f1', to: 's2' },
  { from: 'f1', to: 's6' },
  { from: 'f2', to: 's5' },
  { from: 'f3', to: 's1' },
  { from: 'f4', to: 's3' },
  { from: 'f4', to: 's7' },
  { from: 'f5', to: 's1' },
  { from: 'f6', to: 's4' },
  { from: 'f7', to: 's6' },
  { from: 'f7', to: 's8' },
  { from: 'f8', to: 's4' },
  { from: 'f2', to: 's3' },
];

export const stats = [
  { label: 'Aktif Tesis', value: '42+' },
  { label: 'Servis Ortağı', value: '24' },
  { label: 'Tamamlanan İş Emri', value: '1.200+' },
];

export const proofPoints = [
  { label: 'Aktif bakım ağı', key: 'network' },
  { label: 'Onaylı servis firmaları', key: 'verified' },
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
  'Müşteri portföyü ve sözleşme takibi',
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
