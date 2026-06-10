export const cityDistricts: Record<string, string[]> = {
  Adana: ['Seyhan', 'Yüreğir', 'Çukurova', 'Sarıçam', 'Ceyhan', 'İmamoğlu', 'Karataş', 'Kozan'],
  Ankara: ['Çankaya', 'Keçiören', 'Yenimahalle', 'Mamak', 'Sincan', 'Etimesgut', 'Altındağ', 'Gölbaşı', 'Kahramankazan'],
  Antalya: ['Muratpaşa', 'Kepez', 'Konyaaltı', 'Aksu', 'Döşemealtı', 'Alanya', 'Manavgat', 'Serik'],
  Bursa: ['Osmangazi', 'Nilüfer', 'Yıldırım', 'Gemlik', 'Gürsu', 'Kestel', 'Mudanya', 'İnegöl'],
  Denizli: ['Merkezefendi', 'Pamukkale', 'Honaz', 'Sarayköy', 'Çardak', 'Tavas'],
  Diyarbakır: ['Bağlar', 'Kayapınar', 'Sur', 'Yenişehir', 'Ergani', 'Bismil'],
  Eskişehir: ['Odunpazarı', 'Tepebaşı', 'Sivrihisar', 'İnönü', 'Mahmudiye'],
  Gaziantep: ['Şahinbey', 'Şehitkamil', 'Oğuzeli', 'Nizip', 'Araban', 'İslahiye'],
  Hatay: ['Antakya', 'Defne', 'İskenderun', 'Dörtyol', 'Payas', 'Erzin', 'Kırıkhan'],
  İstanbul: [
    'Adalar',
    'Arnavutköy',
    'Ataşehir',
    'Avcılar',
    'Bağcılar',
    'Bahçelievler',
    'Bakırköy',
    'Başakşehir',
    'Bayrampaşa',
    'Beşiktaş',
    'Beykoz',
    'Beylikdüzü',
    'Beyoğlu',
    'Büyükçekmece',
    'Çatalca',
    'Çekmeköy',
    'Esenler',
    'Esenyurt',
    'Eyüpsultan',
    'Fatih',
    'Gaziosmanpaşa',
    'Güngören',
    'Kadıköy',
    'Kağıthane',
    'Kartal',
    'Küçükçekmece',
    'Maltepe',
    'Pendik',
    'Sancaktepe',
    'Sarıyer',
    'Silivri',
    'Sultanbeyli',
    'Sultangazi',
    'Şile',
    'Şişli',
    'Tuzla',
    'Ümraniye',
    'Üsküdar',
    'Zeytinburnu',
  ],
  İzmir: ['Aliağa', 'Balçova', 'Bayraklı', 'Bornova', 'Buca', 'Çiğli', 'Gaziemir', 'Karabağlar', 'Karşıyaka', 'Kemalpaşa', 'Konak', 'Menemen', 'Torbalı'],
  Kayseri: ['Kocasinan', 'Melikgazi', 'Talas', 'İncesu', 'Hacılar', 'Develi'],
  Kocaeli: ['İzmit', 'Gebze', 'Dilovası', 'Darıca', 'Çayırova', 'Körfez', 'Derince', 'Başiskele', 'Kartepe', 'Gölcük'],
  Konya: ['Selçuklu', 'Meram', 'Karatay', 'Ereğli', 'Akşehir', 'Beyşehir', 'Cihanbeyli'],
  Malatya: ['Battalgazi', 'Yeşilyurt', 'Akçadağ', 'Doğanşehir'],
  Manisa: ['Yunusemre', 'Şehzadeler', 'Akhisar', 'Turgutlu', 'Salihli', 'Soma'],
  Mersin: ['Akdeniz', 'Mezitli', 'Toroslar', 'Yenişehir', 'Tarsus', 'Erdemli'],
  Sakarya: ['Adapazarı', 'Serdivan', 'Erenler', 'Arifiye', 'Akyazı', 'Hendek', 'Karasu', 'Sapanca'],
  Samsun: ['Atakum', 'İlkadım', 'Canik', 'Tekkeköy', 'Bafra', 'Çarşamba'],
  Tekirdağ: ['Çerkezköy', 'Çorlu', 'Ergene', 'Kapaklı', 'Süleymanpaşa', 'Muratlı', 'Malkara'],
  Trabzon: ['Ortahisar', 'Akçaabat', 'Arsin', 'Yomra', 'Of', 'Vakfıkebir'],
};

export const cities = Object.keys(cityDistricts);

export function districtsForCity(city?: string | null) {
  return city ? cityDistricts[city] ?? [] : [];
}

export function firstDistrictForCity(city?: string | null) {
  return districtsForCity(city)[0] ?? '';
}

export function normalizeDistrictList(values: string[]) {
  return values
    .map((value) => value.trim())
    .filter(Boolean)
    .filter((value, index, all) => all.indexOf(value) === index);
}

export function formatLocation(city?: string | null, district?: string | null, address?: string | null) {
  return [address, district, city].map((value) => value?.trim()).filter(Boolean).join(', ');
}
