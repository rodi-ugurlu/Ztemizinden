import { useEffect, useState, type ElementType, type FormEvent } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { api, type UploadResponse } from '@/lib/api';
import { cities, districtsForCity, firstDistrictForCity, formatLocation } from '@/lib/locations';
import {
  AlertCircle,
  CheckCircle2,
  Edit3,
  Factory,
  FileText,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  Upload,
  UserRound,
  X,
} from 'lucide-react';
import {
  useCustomerStore,
  type CustomerProfile,
  type UpdateCustomerProfileInput,
} from '@/store/useCustomerStore';

type CustomerProfileForm = UpdateCustomerProfileInput;

const emptyForm: CustomerProfileForm = {
  contactName: '',
  companyName: '',
  phone: '',
  city: '',
  district: '',
  address: '',
  taxNumber: '',
  logoUrl: '',
};

export default function CustomerProfilePage() {
  const {
    customerProfile,
    fetchCustomerProfile,
    updateCustomerProfile,
    isLoading,
    error,
  } = useCustomerStore();
  const [form, setForm] = useState<CustomerProfileForm>(emptyForm);
  const [isEditing, setIsEditing] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [localError, setLocalError] = useState('');

  useEffect(() => {
    void fetchCustomerProfile();
  }, [fetchCustomerProfile]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice('');
    setLocalError('');
    setIsSaving(true);

    try {
      let logoUrl = form.logoUrl;
      if (logoFile) {
        const formData = new FormData();
        formData.append('file', logoFile);
        const upload = await api.upload<UploadResponse>('/uploads/profile-logo', formData);
        logoUrl = upload.url;
      }

      const updatedProfile = await updateCustomerProfile({
        ...form,
        logoUrl,
      });
      setForm(profileToForm(updatedProfile));
      setLogoFile(null);
      setIsEditing(false);
      setNotice('Firma künyesi güncellendi.');
    } catch (submitError) {
      setLocalError(submitError instanceof Error ? submitError.message : 'Profil güncellenemedi');
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    if (customerProfile) {
      setForm(profileToForm(customerProfile));
    }
    setLogoFile(null);
    setIsEditing(false);
    setNotice('');
    setLocalError('');
  };

  const startEditing = () => {
    if (customerProfile) {
      setForm(profileToForm(customerProfile));
    }
    setLogoFile(null);
    setNotice('');
    setLocalError('');
    setIsEditing(true);
  };

  if (isLoading && !customerProfile) {
    return <ProfileLoading title="Firma profili hazırlanıyor..." />;
  }

  if (error && !customerProfile) {
    return <ProfileError message={error} onRetry={() => void fetchCustomerProfile()} />;
  }

  const profile = customerProfile;
  const displayForm = isEditing ? form : profile ? profileToForm(profile) : form;
  const availableDistricts = districtsForCity(displayForm.city);
  const handleCityChange = (city: string) => {
    setForm((current) => ({
      ...current,
      city,
      district: firstDistrictForCity(city),
    }));
  };

  return (
    <div className="w-full flex-1 bg-slate-50 p-4 sm:p-6 lg:p-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-600">Fabrika/İşletme Künyesi</p>
            <h1 className="mt-2 text-3xl font-black tracking-normal text-slate-950">Firma Profili</h1>
            <p className="mt-1 text-sm text-slate-500">
              Dashboard, varlıklar ve talepler bu firma bilgileriyle ilişkilendirilir.
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

        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-6 xl:grid-cols-[0.92fr_1.4fr]">
          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Factory className="h-5 w-5 text-red-600" />
                Firma Kartı
              </CardTitle>
              <CardDescription>Künye ve görsel kimlik</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="flex items-start gap-4">
                <LogoPreview logoUrl={displayForm.logoUrl} companyName={displayForm.companyName || profile?.companyName} />
                <div className="min-w-0 flex-1">
                  <p className="text-xl font-black text-slate-950">{displayForm.companyName || 'Firma adı'}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                    <MapPin className="h-3.5 w-3.5" />
                    {formatLocation(displayForm.city, displayForm.district) || 'Lokasyon belirtilmedi'}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                      {profile?.status === 'ACTIVE' ? 'Aktif fabrika/işletme' : 'Askıda'}
                    </Badge>
                    {displayForm.taxNumber && (
                      <Badge variant="outline" className="border-slate-200 text-slate-600">
                        VKN/TCKN {displayForm.taxNumber}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <Label htmlFor="customer-logo" className="text-xs font-bold uppercase tracking-[0.14em] text-slate-500">
                  Logo
                </Label>
                <div className="mt-3 flex flex-col gap-3">
                  <Input
                    id="customer-logo"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    disabled={!isEditing || isSaving}
                    onChange={(event) => setLogoFile(event.currentTarget.files?.[0] ?? null)}
                  />
                  <p className="text-xs leading-5 text-slate-500">
                    PNG, JPG veya WEBP. En fazla 5 MB. {logoFile ? `Seçilen: ${logoFile.name}` : ''}
                  </p>
                </div>
              </div>

              <div className="grid gap-3 text-sm">
                <InfoRow icon={Mail} label="E-posta" value={profile?.email ?? '-'} />
                <InfoRow icon={UserRound} label="Yetkili" value={displayForm.contactName || '-'} />
                <InfoRow icon={Phone} label="Telefon" value={displayForm.phone || '-'} />
                <InfoRow icon={MapPin} label="Adres" value={formatLocation(displayForm.city, displayForm.district, displayForm.address) || 'Adres belirtilmedi'} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-red-600" />
                Künye Bilgileri
              </CardTitle>
              <CardDescription>Firma adı, yetkili kişi ve fatura/iletişim detayları</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <ProfileField
                  id="customer-company"
                  label="Firma adı"
                  value={displayForm.companyName}
                  disabled={!isEditing || isSaving}
                  onChange={(value) => setForm((current) => ({ ...current, companyName: value }))}
                  required
                />
                <ProfileField
                  id="customer-contact"
                  label="Yetkili kişi"
                  value={displayForm.contactName}
                  disabled={!isEditing || isSaving}
                  onChange={(value) => setForm((current) => ({ ...current, contactName: value }))}
                  required
                />
                <ProfileField
                  id="customer-phone"
                  label="Telefon"
                  value={displayForm.phone}
                  disabled={!isEditing || isSaving}
                  onChange={(value) => setForm((current) => ({ ...current, phone: value }))}
                  required
                />
                <SelectField
                  id="customer-city"
                  label="İl"
                  value={displayForm.city}
                  disabled={!isEditing || isSaving}
                  options={cities}
                  placeholder="İl seçin"
                  onChange={handleCityChange}
                  required
                />
                <SelectField
                  id="customer-district"
                  label="İlçe"
                  value={displayForm.district}
                  disabled={!isEditing || isSaving || availableDistricts.length === 0}
                  options={availableDistricts}
                  placeholder="İlçe seçin"
                  onChange={(value) => setForm((current) => ({ ...current, district: value }))}
                  required
                />
                <ProfileField
                  id="customer-tax"
                  label="Vergi / TCKN no"
                  value={displayForm.taxNumber ?? ''}
                  disabled={!isEditing || isSaving}
                  onChange={(value) => setForm((current) => ({ ...current, taxNumber: value }))}
                />
                <div className="space-y-2">
                  <Label>E-posta</Label>
                  <Input value={profile?.email ?? ''} disabled />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer-address">Açık adres</Label>
                <Textarea
                  id="customer-address"
                  value={displayForm.address ?? ''}
                  disabled={!isEditing || isSaving}
                  onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))}
                  placeholder="Mahalle, cadde/sokak, bina no, OSB/fabrika kapısı"
                  className="min-h-28"
                  required
                />
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="mt-0.5 h-5 w-5 text-emerald-600" />
                  <div>
                    <p className="font-semibold text-slate-900">Profil kaydı</p>
                    <p className="mt-1 text-sm leading-6 text-slate-500">
                      Bu bilgiler fabrika/işletme portalındaki künye görünümü ve servis talebi bağlamı için kullanılır.
                    </p>
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="flex justify-end">
                  <Button type="submit" className="bg-red-600 hover:bg-red-700" disabled={isSaving}>
                    {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Kaydet
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}

function profileToForm(profile: CustomerProfile): CustomerProfileForm {
  return {
    contactName: profile.contactName || profile.name || '',
    companyName: profile.companyName || '',
    phone: profile.phone || '',
    city: profile.city || '',
    district: profile.district || '',
    address: profile.address ?? '',
    taxNumber: profile.taxNumber ?? '',
    logoUrl: profile.logoUrl ?? '',
  };
}

function LogoPreview({ logoUrl, companyName }: { logoUrl?: string | null; companyName?: string }) {
  return (
    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-slate-950 text-2xl font-black text-white shadow-sm">
      {logoUrl ? (
        <img src={logoUrl} alt={`${companyName ?? 'Firma'} logosu`} className="h-full w-full object-cover" />
      ) : (
        <span>{(companyName || 'M').trim().charAt(0).toLocaleUpperCase('tr-TR')}</span>
      )}
    </div>
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
            <h2 className="font-semibold text-red-950">Firma profili yüklenemedi</h2>
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
