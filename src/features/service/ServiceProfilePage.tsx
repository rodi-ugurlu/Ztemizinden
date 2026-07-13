import { useEffect, useState, type ElementType, type FormEvent } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { api, resolvePublicFileUrl, type UploadResponse } from '@/lib/api';
import { cities, districtsForCity, firstDistrictForCity, formatLocation, normalizeDistrictList } from '@/lib/locations';
import {
  AlertCircle,
  Award,
  Building2,
  CheckCircle2,
  Edit3,
  Eye,
  EyeOff,
  FileCheck2,
  FileText,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  Star,
  Sparkles,
  Tags,
  Upload,
  UserRound,
  Wrench,
  X,
} from 'lucide-react';
import { serviceSpecialtyCategories } from '@/lib/serviceExpertise';
import { useAuthStore } from '@/store/useAuthStore';
import { useServiceStore, type UpdateProviderProfileInput } from '@/store/useServiceStore';
import type { ProviderDocument, ProviderStatus, ServiceProvider } from '@/store/useAdminStore';
import type { TicketCategory } from '@/store/useCustomerStore';

type ServiceProfileForm = UpdateProviderProfileInput;

const emptyForm: ServiceProfileForm = {
  name: '',
  contactName: '',
  phone: '',
  city: '',
  district: '',
  address: '',
  taxNumber: '',
  logoUrl: '',
  specialties: [],
  expertiseTags: [],
  coverageDistricts: [],
};

export default function ServiceProfilePage() {
  const user = useAuthStore((state) => state.user);
  const {
    providerProfile,
    resolveProviderSession,
    fetchProviderProfile,
    updateProviderProfile,
    setLandingVisibility,
    currentProviderId,
    isLoading,
    error,
  } = useServiceStore();
  const [form, setForm] = useState<ServiceProfileForm>(emptyForm);
  const [expertiseInput, setExpertiseInput] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLandingUpdating, setIsLandingUpdating] = useState(false);
  const [notice, setNotice] = useState('');
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    void resolveProviderSession(user);
  }, [user, resolveProviderSession]);

  useEffect(() => {
    if (currentProviderId) {
      void fetchProviderProfile();
    }
  }, [currentProviderId, fetchProviderProfile]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice('');
    setLocalError('');

    const expertiseTags = parseTags(expertiseInput);
    if (form.specialties.length === 0) {
      setLocalError('En az bir ana uzmanlık alanı seçilmelidir.');
      return;
    }
    if (!form.city || !form.district) {
      setLocalError('Servis merkezi için il ve ilçe seçilmelidir.');
      return;
    }
    if (form.coverageDistricts.length === 0) {
      setLocalError('Hizmet verilen en az bir ilçe seçilmelidir.');
      return;
    }
    if (logoFile && logoFile.size > 1024 * 1024) {
      setLocalError('Firma logosu en fazla 1 MB olabilir.');
      return;
    }

    setIsSaving(true);
    try {
      let logoUrl = form.logoUrl;
      if (logoFile) {
        const formData = new FormData();
        formData.append('file', logoFile);
        const upload = await api.upload<UploadResponse>('/uploads/profile-logo', formData);
        logoUrl = upload.url;
      }

      const updatedProvider = await updateProviderProfile({
        ...form,
        logoUrl,
        expertiseTags,
        coverageDistricts: normalizeDistrictList(form.coverageDistricts),
      });
      const nextForm = providerToForm(updatedProvider);
      setForm(nextForm);
      setExpertiseInput(nextForm.expertiseTags.join(', '));
      setLogoFile(null);
      setIsEditing(false);
      setNotice('Servis profili güncellendi.');
    } catch (submitError) {
      setLocalError(submitError instanceof Error ? submitError.message : 'Servis profili güncellenemedi');
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    if (providerProfile) {
      const nextForm = providerToForm(providerProfile);
      setForm(nextForm);
      setExpertiseInput(nextForm.expertiseTags.join(', '));
    }
    setLogoFile(null);
    setIsEditing(false);
    setNotice('');
    setLocalError('');
  };

  const handleLandingVisibility = async (visible: boolean) => {
    setNotice('');
    setLocalError('');
    setIsLandingUpdating(true);
    try {
      const provider = await setLandingVisibility(visible);
      setNotice(
        provider.landingVisibility === 'PENDING'
          ? 'Ana sayfa vitrin talebiniz incelemeye gönderildi.'
          : provider.landingVisibility === 'VISIBLE'
            ? 'Servisiniz Maintly vitrininde yayında.'
            : 'Ana sayfa vitrin görünürlüğü kapatıldı.'
      );
    } catch (visibilityError) {
      setLocalError(
        visibilityError instanceof Error
          ? visibilityError.message
          : 'Vitrin görünürlüğü güncellenemedi'
      );
    } finally {
      setIsLandingUpdating(false);
    }
  };

  const startEditing = () => {
    if (providerProfile) {
      const nextForm = providerToForm(providerProfile);
      setForm(nextForm);
      setExpertiseInput(nextForm.expertiseTags.join(', '));
    }
    setLogoFile(null);
    setNotice('');
    setLocalError('');
    setIsEditing(true);
  };

  const toggleSpecialty = (specialty: TicketCategory) => {
    setForm((current) => ({
      ...current,
      specialties: current.specialties.includes(specialty)
        ? current.specialties.filter((item) => item !== specialty)
        : [...current.specialties, specialty],
    }));
  };

  if (isLoading && !providerProfile) {
    return <ProfileLoading title="Servis profili hazırlanıyor..." />;
  }

  if (error && !providerProfile) {
    return <ProfileError message={error} onRetry={() => void fetchProviderProfile()} />;
  }

  const statusMeta = providerStatusMeta(providerProfile?.status);
  const StatusIcon = statusMeta.icon;
  const documents = providerProfile?.documents ?? [];
  const displayForm = isEditing ? form : providerProfile ? providerToForm(providerProfile) : form;
  const displayExpertiseInput = isEditing ? expertiseInput : displayForm.expertiseTags.join(', ');
  const availableDistricts = districtsForCity(displayForm.city);
  const handleCityChange = (city: string) => {
    const district = firstDistrictForCity(city);
    setForm((current) => ({
      ...current,
      city,
      district,
      coverageDistricts: district ? [district] : [],
    }));
  };
  const toggleCoverageDistrict = (district: string) => {
    setForm((current) => ({
      ...current,
      coverageDistricts: current.coverageDistricts.includes(district)
        ? current.coverageDistricts.filter((item) => item !== district)
        : [...current.coverageDistricts, district],
    }));
  };

  return (
    <div className="w-full flex-1 bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-600">Servis Künyesi</p>
            <h1 className="mt-2 text-3xl font-black tracking-normal text-slate-950">Servis Profili</h1>
            <p className="mt-1 text-sm text-slate-500">
              Servis kimliği, uzmanlık alanları, belgeler ve operasyon onay durumu.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {isEditing ? (
              <Button type="button" variant="outline" onClick={resetForm} disabled={isSaving}>
                <X className="h-4 w-4" />
                Vazgeç
              </Button>
            ) : (
              <Button type="button" className="bg-red-600 hover:bg-red-700" onClick={startEditing}>
                <Edit3 className="h-4 w-4" />
                Düzenle
              </Button>
            )}
          </div>
        </div>

        {(notice || localError || error) && (
          <div
            className={`flex items-start gap-3 rounded-lg border p-4 text-sm ${
              localError || error
                ? 'border-red-200 bg-red-50 text-red-800'
                : 'border-emerald-200 bg-emerald-50 text-emerald-800'
            }`}
          >
            {localError || error ? (
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            ) : (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
            )}
            <span className="font-semibold">{localError || error || notice}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 xl:grid-cols-[0.95fr_1.45fr]">
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Building2 className="h-5 w-5 text-red-600" />
                Servis Kartı
              </CardTitle>
              <CardDescription>Firma görünümü ve operasyon güven sinyalleri</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-start gap-4">
                <LogoPreview logoUrl={displayForm.logoUrl} companyName={displayForm.name || providerProfile?.name} />
                <div className="min-w-0 flex-1">
                  <p className="text-xl font-black text-slate-950">{displayForm.name || 'Servis adı'}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                    <MapPin className="h-3.5 w-3.5" />
                    {formatLocation(displayForm.city, displayForm.district) || 'Lokasyon belirtilmedi'}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge className={statusMeta.badgeClass}>{statusMeta.label}</Badge>
                    <Badge variant="outline" className="border-amber-200 bg-amber-50 text-amber-700">
                      <Star className="mr-1 h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                      {providerProfile?.rating ?? 0}
                    </Badge>
                    <Badge variant="outline" className="border-slate-200 text-slate-600">
                      {providerProfile?.completedJobs ?? 0} tamamlanan iş
                    </Badge>
                  </div>
                </div>
              </div>

              <div className={`rounded-lg border p-4 ${statusMeta.panelClass}`}>
                <div className="flex items-start gap-3">
                  <StatusIcon className={`mt-0.5 h-5 w-5 ${statusMeta.iconClass}`} />
                  <div>
                    <p className="font-semibold text-slate-900">{statusMeta.title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{statusMeta.description}</p>
                  </div>
                </div>
              </div>

              <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-950 p-5 text-white shadow-xl shadow-slate-950/10">
                <div className="pointer-events-none absolute -right-10 -top-14 h-32 w-32 rounded-full bg-red-500/25 blur-3xl" />
                <div className="relative">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-red-300">
                        <Sparkles className="h-3.5 w-3.5" />
                        Maintly vitrini
                      </p>
                      <h3 className="mt-2 text-base font-black">Ana sayfada markanızı gösterin</h3>
                    </div>
                    <LandingVisibilityBadge visibility={providerProfile?.landingVisibility ?? 'HIDDEN'} />
                  </div>
                  <p className="mt-3 text-xs leading-5 text-slate-400">
                    Operasyon onayı tamamlanan servisler günlük dönen Maintly ağında otomatik olarak yer alır.
                  </p>
                  {providerProfile?.status !== 'Verified' && (
                    <p className="mt-3 rounded-lg border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs font-semibold text-amber-200">
                      Vitrin talebi için önce operasyon onayının tamamlanması gerekir.
                    </p>
                  )}
                  {providerProfile?.status === 'Verified' && !providerProfile.logoUrl && (
                    <p className="mt-3 rounded-lg border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-xs font-semibold text-amber-200">
                      Logo yüklerseniz vitrinde kendi logonuz görünür; logo yoksa firma adınızdan temiz bir monogram kullanılır.
                    </p>
                  )}
                  <Button
                    type="button"
                    variant={providerProfile?.landingVisibility === 'HIDDEN' ? 'default' : 'outline'}
                    disabled={
                      isLandingUpdating ||
                      providerProfile?.status !== 'Verified'
                    }
                    onClick={() => void handleLandingVisibility(providerProfile?.landingVisibility === 'HIDDEN')}
                    className={
                      providerProfile?.landingVisibility === 'HIDDEN'
                        ? 'mt-4 w-full bg-red-500 text-white hover:bg-red-600'
                        : 'mt-4 w-full border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white'
                    }
                  >
                    {providerProfile?.landingVisibility === 'HIDDEN' ? (
                      <><Eye className="h-4 w-4" /> Vitrin Talebi Gönder</>
                    ) : (
                      <><EyeOff className="h-4 w-4" /> Vitrinden Çık</>
                    )}
                  </Button>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <Label htmlFor="service-logo" className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                  Logo
                </Label>
                <div className="mt-3 flex flex-col gap-3">
                  <Input
                    id="service-logo"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    disabled={!isEditing || isSaving}
                    onChange={(event) => setLogoFile(event.currentTarget.files?.[0] ?? null)}
                  />
                  <p className="text-xs leading-5 text-slate-500">
                    PNG, JPG veya WEBP. En fazla 1 MB. {logoFile ? `Seçilen: ${logoFile.name}` : ''}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 text-sm">
                <InfoRow icon={Mail} label="E-posta" value={providerProfile?.email ?? '-'} />
                <InfoRow icon={UserRound} label="Yetkili" value={displayForm.contactName || '-'} />
                <InfoRow icon={Phone} label="Telefon" value={displayForm.phone || '-'} />
                <InfoRow icon={MapPin} label="Adres" value={formatLocation(displayForm.city, displayForm.district, displayForm.address) || 'Adres belirtilmedi'} />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-red-600" />
                  Künye Bilgileri
                </CardTitle>
                <CardDescription>Servis adı, yetkili kişi ve fatura/iletişim detayları</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <ProfileField
                    id="service-name"
                    label="Servis adı"
                    value={displayForm.name}
                    disabled={!isEditing || isSaving}
                    onChange={(value) => setForm((current) => ({ ...current, name: value }))}
                    required
                  />
                  <ProfileField
                    id="service-contact"
                    label="Yetkili kişi"
                    value={displayForm.contactName}
                    disabled={!isEditing || isSaving}
                    onChange={(value) => setForm((current) => ({ ...current, contactName: value }))}
                    required
                  />
                  <ProfileField
                    id="service-phone"
                    label="Telefon"
                    value={displayForm.phone}
                    disabled={!isEditing || isSaving}
                    onChange={(value) => setForm((current) => ({ ...current, phone: value }))}
                    required
                  />
                  <SelectField
                    id="service-city"
                    label="İl"
                    value={displayForm.city}
                    disabled={!isEditing || isSaving}
                    options={cities}
                    placeholder="İl seçin"
                    onChange={handleCityChange}
                    required
                  />
                  <SelectField
                    id="service-district"
                    label="Merkez ilçe"
                    value={displayForm.district}
                    disabled={!isEditing || isSaving || availableDistricts.length === 0}
                    options={availableDistricts}
                    placeholder="İlçe seçin"
                    onChange={(value) => setForm((current) => ({ ...current, district: value }))}
                    required
                  />
                  <ProfileField
                    id="service-tax"
                    label="Vergi / TCKN no"
                    value={displayForm.taxNumber ?? ''}
                    disabled={!isEditing || isSaving}
                    onChange={(value) => setForm((current) => ({ ...current, taxNumber: value }))}
                  />
                  <div className="space-y-2">
                    <Label>E-posta</Label>
                    <Input value={providerProfile?.email ?? ''} disabled />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="service-address">Açık adres</Label>
                  <Textarea
                    id="service-address"
                    value={displayForm.address ?? ''}
                    disabled={!isEditing || isSaving}
                    onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
                    placeholder="Mahalle, cadde/sokak, bina no, servis merkezi"
                    className="min-h-24"
                    required
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="h-5 w-5 text-red-600" />
                  Hizmet Bölgeleri
                </CardTitle>
                <CardDescription>Servisin iş alabileceği ilçeler</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {availableDistricts.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {availableDistricts.map((district) => (
                      <label
                        key={district}
                        className={`flex items-center gap-3 rounded-lg border p-3 text-sm font-semibold transition ${
                          displayForm.coverageDistricts.includes(district)
                            ? 'border-red-200 bg-red-50 text-red-700'
                            : 'border-slate-200 bg-white text-slate-600'
                        } ${isEditing ? 'cursor-pointer' : 'cursor-default'}`}
                      >
                        <Checkbox
                          checked={displayForm.coverageDistricts.includes(district)}
                          disabled={!isEditing || isSaving}
                          onCheckedChange={() => toggleCoverageDistrict(district)}
                        />
                        {district}
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5 text-sm font-semibold text-slate-500">
                    Önce il seçin.
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Wrench className="h-5 w-5 text-red-600" />
                  Uzmanlıklar
                </CardTitle>
                <CardDescription>Servisin görüneceği ana kategoriler ve detay etiketleri</CardDescription>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {serviceSpecialtyCategories.map((specialty) => (
                    <label
                      key={specialty.value}
                      className={`flex items-center gap-3 rounded-lg border p-3 text-sm font-semibold transition ${
                        displayForm.specialties.includes(specialty.value)
                          ? 'border-red-200 bg-red-50 text-red-700'
                          : 'border-slate-200 bg-white text-slate-600'
                      } ${isEditing ? 'cursor-pointer' : 'cursor-default'}`}
                    >
                      <Checkbox
                        checked={displayForm.specialties.includes(specialty.value)}
                        disabled={!isEditing || isSaving}
                        onCheckedChange={() => toggleSpecialty(specialty.value)}
                      />
                      {specialty.label}
                    </label>
                  ))}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="service-expertise" className="flex items-center gap-2">
                    <Tags className="h-4 w-4 text-red-600" />
                    Detay uzmanlık etiketleri
                  </Label>
                  <Textarea
                    id="service-expertise"
                    value={displayExpertiseInput}
                    disabled={!isEditing || isSaving}
                    onChange={(event) => setExpertiseInput(event.target.value)}
                    placeholder="pompa, vana, otomasyon..."
                    className="min-h-24"
                  />
                  <p className="text-xs text-slate-500">Virgül veya satır sonu ile ayırın.</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {parseTags(displayExpertiseInput).map((tag) => (
                    <Badge key={tag} variant="outline" className="border-slate-200 bg-slate-50 text-slate-600">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShieldCheck className="h-5 w-5 text-red-600" />
                  Belgeler
                </CardTitle>
                <CardDescription>Operasyon onayına esas servis belgeleri</CardDescription>
              </CardHeader>
              <CardContent>
                {documents.length > 0 ? (
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    {documents.map((document) => (
                      <DocumentRow key={document.id} document={document} />
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
                    <FileCheck2 className="mx-auto h-8 w-8 text-slate-400" />
                    <p className="mt-2 text-sm font-semibold text-slate-700">Kayıtlı belge yok</p>
                    <p className="mt-1 text-xs text-slate-500">Belgeler servis başvurusu veya ekip sayfasından yüklenebilir.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {isEditing && (
              <div className="flex justify-end">
                <Button type="submit" className="bg-red-600 hover:bg-red-700" disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Kaydet
                </Button>
              </div>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}

function providerToForm(provider: ServiceProvider): ServiceProfileForm {
  return {
    name: provider.name || '',
    contactName: provider.contactName || '',
    phone: provider.phone || '',
    city: provider.city || '',
    district: provider.district || '',
    address: provider.address ?? '',
    taxNumber: provider.taxNumber ?? '',
    logoUrl: provider.logoUrl ?? '',
    specialties: provider.specialties ?? [],
    expertiseTags: provider.expertiseTags ?? [],
    coverageDistricts: provider.coverageDistricts?.length ? provider.coverageDistricts : provider.district ? [provider.district] : [],
  };
}

function parseTags(value: string) {
  return value
    .split(/[,\n]/)
    .map((tag) => tag.trim().replace(/\s+/g, ' ').toLocaleLowerCase('tr-TR'))
    .filter(Boolean)
    .filter((tag, index, all) => all.indexOf(tag) === index);
}

function LogoPreview({ logoUrl, companyName }: { logoUrl?: string | null; companyName?: string }) {
  return (
    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-950 text-2xl font-black text-white shadow-sm">
      {logoUrl ? (
        <img
          src={resolvePublicFileUrl(logoUrl)}
          alt={`${companyName ?? 'Servis'} logosu`}
          className="h-full w-full bg-white object-contain p-1.5"
        />
      ) : (
        <span>{(companyName || 'S').trim().charAt(0).toLocaleUpperCase('tr-TR')}</span>
      )}
    </div>
  );
}

function LandingVisibilityBadge({ visibility }: { visibility: ServiceProvider['landingVisibility'] }) {
  const variants = {
    HIDDEN: 'border-white/10 bg-white/5 text-slate-400',
    PENDING: 'border-amber-300/20 bg-amber-300/10 text-amber-200',
    VISIBLE: 'border-emerald-300/20 bg-emerald-300/10 text-emerald-200',
  };
  const labels = { HIDDEN: 'Kapalı', PENDING: 'İncelemede', VISIBLE: 'Yayında' };

  return (
    <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.12em] ${variants[visibility]}`}>
      {labels[visibility]}
    </span>
  );
}

function ProfileField({
  id,
  label,
  value,
  disabled,
  required = false,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  disabled: boolean;
  required?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        disabled={disabled}
        required={required}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}

function SelectField({
  id,
  label,
  value,
  disabled,
  options,
  placeholder,
  required = false,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  disabled: boolean;
  options: string[];
  placeholder: string;
  required?: boolean;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <select
        id={id}
        value={value}
        disabled={disabled}
        required={required}
        onChange={(event) => onChange(event.target.value)}
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option value={option} key={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="truncate font-medium text-slate-700">{value}</p>
      </div>
    </div>
  );
}

function DocumentRow({ document }: { document: ProviderDocument }) {
  const meta = documentStatusMeta(document.status);
  return (
    <div className="flex items-start gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${meta.iconBox}`}>
        <Award className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold text-slate-900">{document.type}</p>
          <Badge className={meta.badge}>{meta.label}</Badge>
        </div>
        <p className="mt-1 truncate text-xs text-slate-500">{document.originalFileName ?? 'Belge dosyası'}</p>
      </div>
    </div>
  );
}

function documentStatusMeta(status: ProviderDocument['status']) {
  switch (status) {
    case 'Verified':
      return {
        label: 'Onaylı',
        iconBox: 'bg-emerald-100 text-emerald-700',
        badge: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-50',
      };
    case 'Rejected':
      return {
        label: 'Reddedildi',
        iconBox: 'bg-red-100 text-red-700',
        badge: 'bg-red-50 text-red-700 hover:bg-red-50',
      };
    default:
      return {
        label: 'İncelemede',
        iconBox: 'bg-amber-100 text-amber-700',
        badge: 'bg-amber-50 text-amber-700 hover:bg-amber-50',
      };
  }
}

function providerStatusMeta(status?: ProviderStatus) {
  switch (status) {
    case 'Verified':
      return {
        label: 'Onaylı Servis',
        title: 'Operasyon onayı tamamlandı',
        description: 'Servis yeni iş fırsatlarını görebilir, teklif verebilir ve atama alabilir.',
        icon: ShieldCheck,
        badgeClass: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-50',
        panelClass: 'border-emerald-200 bg-emerald-50',
        iconClass: 'text-emerald-700',
      };
    case 'Suspended':
      return {
        label: 'Askıda',
        title: 'Servis hesabı askıda',
        description: 'Operasyon ekibi hesabı tekrar aktif edene kadar yeni iş akışı kapalıdır.',
        icon: AlertCircle,
        badgeClass: 'bg-red-50 text-red-700 hover:bg-red-50',
        panelClass: 'border-red-200 bg-red-50',
        iconClass: 'text-red-700',
      };
    default:
      return {
        label: 'Onay Bekliyor',
        title: 'Operasyon onayı bekleniyor',
        description: 'Belgeler ve firma bilgileri onaylandığında servis iş akışı açılır.',
        icon: FileCheck2,
        badgeClass: 'bg-amber-50 text-amber-700 hover:bg-amber-50',
        panelClass: 'border-amber-200 bg-amber-50',
        iconClass: 'text-amber-700',
      };
  }
}

function ProfileLoading({ title }: { title: string }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center bg-slate-50 p-6">
      <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-5 py-4 shadow-sm">
        <Loader2 className="h-5 w-5 animate-spin text-red-600" />
        <span className="font-semibold text-slate-700">{title}</span>
      </div>
    </div>
  );
}

function ProfileError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="w-full flex-1 bg-slate-50 p-6 lg:p-8">
      <Card className="mx-auto max-w-3xl border-red-200 bg-red-50">
        <CardContent className="flex items-start gap-3 p-6">
          <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />
          <div className="min-w-0 flex-1">
            <h2 className="font-semibold text-red-950">Servis profili yüklenemedi</h2>
            <p className="mt-1 text-sm text-red-700">{message}</p>
            <Button type="button" variant="outline" className="mt-4 bg-white" onClick={onRetry}>
              <Upload className="h-4 w-4" />
              Tekrar Dene
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
