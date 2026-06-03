import type { TicketCategory } from '@/store/useCustomerStore';

export const serviceSpecialtyCategories: Array<{ value: TicketCategory; label: string }> = [
  { value: 'Hydraulic', label: 'Hidrolik' },
  { value: 'Pneumatic', label: 'Pnömatik' },
  { value: 'Mechanic', label: 'Mekanik' },
  { value: 'Electric', label: 'Elektrik' },
  { value: 'General', label: 'Genel' },
  { value: 'Software', label: 'Yazılım' },
];

export const suggestedExpertiseTags = [
  'vana',
  'pompa',
  'motor',
  'rulman',
  'yağ',
  'elektrik',
  'otomasyon',
  'inverter',
  'kompenzasyon',
  'kompanzasyon',
  'tesisat',
  'paslanmaz',
  'su',
  'gider',
  'su şartlandırma',
  'hidrofor',
  'ters ozmos',
  'yumuşak su',
  'kuyu',
  'arıtma',
  'havalandırma',
  'hvac',
  'filtre',
  'atex',
  'sil',
  'pkd',
  'alçak akım',
  'yüksek akım',
  'yangın söndürme sistemleri',
  'yangın pompaları',
  'sensör',
  'buhar',
  'jeneratör',
  'basınçlı hava',
  'kompresör',
  'rediktör',
  'redüktör',
  'salmastra',
  'tamir',
  'pano',
  'valf',
  'pislik tutucu',
  'kondenstop',
  'fitting malzemeleri',
  'izolasyon sistemleri',
  'pt100',
  'pt1000',
  'level sensör',
  'basınç transmitter',
  'manometre',
  'vakum pompası',
  'aktuatör',
  'mil',
];

const categoryLabels: Record<string, string> = Object.fromEntries(
  serviceSpecialtyCategories.map((category) => [category.value, category.label])
);

export function serviceSpecialtyLabel(value: string) {
  return categoryLabels[value] ?? value;
}

export function normalizeExpertiseTag(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('tr-TR');
}

export function normalizeSearchText(value: string) {
  return value
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
