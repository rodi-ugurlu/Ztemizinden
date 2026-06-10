import { useEffect, useState, type FormEvent } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { api, type UploadResponse } from '@/lib/api';
import { formatLocation } from '@/lib/locations';
import { serviceSpecialtyLabel } from '@/lib/serviceExpertise';
import { useAuthStore } from '@/store/useAuthStore';
import { useServiceStore, useTicketStats } from '@/store/useServiceStore';
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Wrench,
  Zap,
  Droplets,
  Settings,
  Award,
  Users,
  TrendingUp,
  Star,
  ShieldCheck,
  Clock,
  AlertTriangle,
  Upload,
  RefreshCw,
} from 'lucide-react';

const providerDocumentTypes = ['Vergi Levhası', 'Sigorta Belgesi', 'Teknik Lisans', 'ISO Sertifikası'];

/**
 * ServiceTeamPage Component
 *
 * Company profile and team overview for Service Provider Portal.
 * Shows provider info, specialties, and performance metrics.
 */
export default function ServiceTeamPage() {
  const user = useAuthStore((state) => state.user);
  const {
    resolveProviderSession,
    currentProviderId,
    fetchMyJobs,
    fetchProviderProfile,
    providerProfile: serviceProviderProfile,
    isLoading,
    error: storeError,
  } = useServiceStore();
  const stats = useTicketStats();
  const [documentType, setDocumentType] = useState(providerDocumentTypes[0]);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  const [documentUploadError, setDocumentUploadError] = useState('');
  const [documentUploadNotice, setDocumentUploadNotice] = useState('');

  useEffect(() => {
    void resolveProviderSession(user);
  }, [user, resolveProviderSession]);

  useEffect(() => {
    if (currentProviderId) {
      fetchMyJobs();
      fetchProviderProfile();
    }
  }, [currentProviderId, fetchMyJobs, fetchProviderProfile]);

  if (!serviceProviderProfile) {
    return (
      <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Ekip & Profil</h1>
          <p className="text-slate-500 mt-1">
            Firma bilgileriniz, ekip üyeleriniz ve performans metrikleri
          </p>
        </div>
        <Card className={storeError ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-white'}>
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              {storeError ? (
                <AlertTriangle className="mt-0.5 h-5 w-5 text-red-600" />
              ) : (
                <Clock className="mt-0.5 h-5 w-5 text-slate-500" />
              )}
              <div>
                <h2 className={`font-semibold ${storeError ? 'text-red-950' : 'text-slate-950'}`}>
                  {storeError ? 'Servis profili yüklenemedi' : 'Servis profili hazırlanıyor'}
                </h2>
                <p className={`mt-1 text-sm ${storeError ? 'text-red-700' : 'text-slate-600'}`}>
                  {storeError || (isLoading
                    ? 'Firma bilgileriniz backend üzerinden doğrulanıyor.'
                    : 'Firma profili alınana kadar onay durumu gösterilmeyecek.')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const providerProfile = {
    companyName: serviceProviderProfile.name || user?.name || 'Servis sağlayıcı',
    contactName: serviceProviderProfile.contactName || '-',
    email: serviceProviderProfile.email || user?.email || '-',
    phone: serviceProviderProfile.phone || '-',
    city: serviceProviderProfile.city || '-',
    district: serviceProviderProfile.district || '',
    coverageDistricts: serviceProviderProfile.coverageDistricts ?? [],
    specialties: serviceProviderProfile.specialties ?? [],
    expertiseTags: serviceProviderProfile.expertiseTags ?? [],
    rating: serviceProviderProfile.rating ?? 0,
    status: serviceProviderProfile.status,
    memberSince: serviceProviderProfile.createdAt ? new Date(serviceProviderProfile.createdAt).getFullYear().toString() : '-',
    documents: serviceProviderProfile.documents ?? [],
  };
  const providerStatusMeta = getProviderStatusMeta(providerProfile.status);
  const ProviderStatusIcon = providerStatusMeta.icon;
  const documentCounts = getDocumentCounts(providerProfile.documents);

  const handleProviderDocumentUpload = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDocumentUploadError('');
    setDocumentUploadNotice('');

    if (!documentFile) {
      setDocumentUploadError('Yüklenecek belge seçilmedi');
      return;
    }

    setIsUploadingDocument(true);
    try {
      const formData = new FormData();
      formData.append('type', documentType);
      formData.append('file', documentFile);
      await api.upload<UploadResponse>('/uploads/provider-documents', formData);
      setDocumentUploadNotice('Belge yüklendi ve operasyon incelemesine gönderildi.');
      setDocumentFile(null);
      await fetchProviderProfile();
    } catch (error) {
      setDocumentUploadError(error instanceof Error ? error.message : 'Belge yüklenemedi');
    } finally {
      setIsUploadingDocument(false);
    }
  };

  const handleRetryDocumentUpload = (type: string) => {
    setDocumentType(type);
    setDocumentUploadError('');
    setDocumentUploadNotice(`${type} için yeni dosyayı seçip yükleyin.`);
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Ekip & Profil</h1>
          <p className="text-slate-500 mt-1">
            Firma bilgileriniz, ekip üyeleriniz ve performans metrikleri
          </p>
        </div>
        <ProviderStatusBadge status={providerProfile.status} />
      </div>

      {storeError && (
        <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-xl flex items-center gap-3 animate-in fade-in duration-300">
          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
          <span className="text-sm font-semibold">{storeError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Company Profile Card */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                {providerProfile.companyName.charAt(0)}
              </div>
              <div>
                <CardTitle className="text-xl">{providerProfile.companyName}</CardTitle>
                <CardDescription className="flex items-center gap-2 mt-1">
                  <MapPin className="w-3 h-3" />
                  {formatLocation(providerProfile.city, providerProfile.district) || providerProfile.city}
                </CardDescription>
              </div>
              <div className="ml-auto flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-full">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="text-sm font-bold text-amber-700">{providerProfile.rating}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className={`rounded-lg border p-4 ${providerStatusMeta.panelClass}`}>
              <div className="flex items-start gap-3">
                <ProviderStatusIcon className={`mt-0.5 h-5 w-5 ${providerStatusMeta.iconClass}`} />
                <div>
                  <p className="text-sm font-semibold text-slate-900">{providerStatusMeta.title}</p>
                  <p className="mt-1 text-sm text-slate-600">{providerStatusMeta.description}</p>
                </div>
              </div>
            </div>

            {/* Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Yetkili</p>
                  <p className="font-medium text-slate-700">{providerProfile.contactName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center">
                  <Phone className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Telefon</p>
                  <p className="font-medium text-slate-700">{providerProfile.phone}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center">
                  <Mail className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">E-posta</p>
                  <p className="font-medium text-slate-700">{providerProfile.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-slate-500" />
                </div>
                <div>
                  <p className="text-xs text-slate-400">Merkez lokasyon</p>
                  <p className="font-medium text-slate-700">{formatLocation(providerProfile.city, providerProfile.district) || providerProfile.city}</p>
                </div>
              </div>
            </div>

            {providerProfile.coverageDistricts.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-red-600" />
                  Hizmet Verilen İlçeler
                </h3>
                <div className="flex flex-wrap gap-2">
                  {providerProfile.coverageDistricts.map((district) => (
                    <Badge key={district} variant="outline" className="bg-slate-50 text-slate-600 border-slate-200 px-3 py-1">
                      {district}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Specialties */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-red-600" />
                Uzmanlık Alanları
              </h3>
              <div className="flex flex-wrap gap-2">
                {providerProfile.specialties.map((specialty) => (
                  <Badge
                    key={specialty}
                    variant="outline"
                    className="bg-red-50 text-red-600 border-red-200/30 px-3 py-1"
                  >
                    <SpecialtyIcon specialty={specialty} className="w-3 h-3 mr-1.5" />
                    {serviceSpecialtyLabel(specialty)}
                  </Badge>
                ))}
              </div>
              {providerProfile.expertiseTags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {providerProfile.expertiseTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="outline"
                      className="border-slate-200 bg-slate-50 px-2.5 py-1 text-slate-600"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Documents */}
            <div>
              <h3 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-red-600" />
                Belgeler
              </h3>
              {providerProfile.documents.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {providerProfile.documents.map((document) => (
                    <Badge key={document.id} variant="outline" className={`${documentStatusClass(document.status)} px-3 py-1`}>
                      <Award className="w-3 h-3 mr-1.5" />
                      {document.type}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">Kayıtlı belge bulunmuyor.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Performance Metrics */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-red-600" />
                Performans
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <MetricRow label="Aktif İşler" value={stats.activeJobs} color="text-indigo-600" />
              <MetricRow label="Tekliflerim" value={stats.myProposals} color="text-amber-600" />
              <MetricRow label="Tamamlanan" value={stats.completedJobs} color="text-emerald-600" />
              <MetricRow label="Yeni Fırsatlar" value={stats.newOpportunities} color="text-blue-600" />
              <div className="pt-3 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-500 flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    Üyelik
                  </span>
                  <span className="text-sm font-medium text-slate-700">{providerProfile.memberSince}'den beri</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Provider Documents */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-red-600" />
            Sağlayıcı Belgeleri
          </CardTitle>
          <CardDescription>
            {documentCounts.verified} onaylı, {documentCounts.pending} incelemede, {documentCounts.rejected} reddedildi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleProviderDocumentUpload}
            className="mb-5 grid grid-cols-1 gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 md:grid-cols-[180px_minmax(0,1fr)_auto]"
          >
            <select
              value={documentType}
              onChange={(event) => setDocumentType(event.target.value)}
              className="h-10 rounded-md border border-slate-200 bg-white px-3 text-sm text-slate-700 outline-none focus:border-red-300"
            >
              {providerDocumentTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <label className="flex h-10 min-w-0 cursor-pointer items-center rounded-md border border-dashed border-slate-300 bg-white px-3 text-sm text-slate-500">
              <span className="truncate">{documentFile?.name ?? 'PDF, JPG veya PNG belge seçin'}</span>
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
                className="hidden"
                onChange={(event) => setDocumentFile(event.currentTarget.files?.[0] ?? null)}
              />
            </label>
            <Button type="submit" disabled={isUploadingDocument} className="h-10 bg-red-600 hover:bg-red-700">
              <Upload className="mr-2 h-4 w-4" />
              {isUploadingDocument ? 'Yükleniyor' : 'Yükle'}
            </Button>
            {(documentUploadError || documentUploadNotice) && (
              <p
                className={`md:col-span-3 text-sm font-medium ${
                  documentUploadError ? 'text-red-600' : 'text-emerald-600'
                }`}
              >
                {documentUploadError || documentUploadNotice}
              </p>
            )}
          </form>

          {providerProfile.documents.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {providerProfile.documents.map((document) => (
                <div key={document.id} className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
                  <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center text-red-600">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 text-sm">{document.type}</p>
                    <p className="text-xs text-slate-400">{document.originalFileName || document.url || 'Dosya'}</p>
                    {document.status === 'Rejected' && document.notes && (
                      <p className="mt-2 rounded-md border border-red-100 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                        Ret nedeni: {document.notes}
                      </p>
                    )}
                    {document.status === 'Pending' && (
                      <p className="mt-2 text-xs text-amber-600">Operasyon incelemesi bekleniyor.</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <DocumentStatusBadge status={document.status} />
                    {document.status === 'Rejected' && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleRetryDocumentUpload(document.type)}
                        className="h-8 border-red-200 bg-red-50 text-red-600"
                      >
                        <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                        Yenile
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-6 text-center text-sm text-slate-500">
              Belge bulunmuyor.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ==========================================
// HELPER COMPONENTS
// ==========================================

function getDocumentCounts(documents: Array<{ status: 'Pending' | 'Verified' | 'Rejected' }>) {
  return {
    pending: documents.filter((document) => document.status === 'Pending').length,
    verified: documents.filter((document) => document.status === 'Verified').length,
    rejected: documents.filter((document) => document.status === 'Rejected').length,
  };
}

function ProviderStatusBadge({ status }: { status: 'Pending Verification' | 'Verified' | 'Suspended' }) {
  const meta = getProviderStatusMeta(status);
  return (
    <Badge variant="outline" className={`${meta.badgeClass} px-3 py-1.5 text-xs font-semibold`}>
      {meta.label}
    </Badge>
  );
}

function getProviderStatusMeta(status: 'Pending Verification' | 'Verified' | 'Suspended') {
  const variants = {
    'Pending Verification': {
      label: 'Operasyon Onayı Bekliyor',
      title: 'Operasyon onayı bekleniyor',
      description: 'Başvurunuz operasyon merkezi tarafından incelendikten sonra fırsatlar ve işler açılacak.',
      icon: Clock,
      iconClass: 'text-amber-600',
      badgeClass: 'bg-amber-50 text-amber-700 border-amber-200',
      panelClass: 'bg-amber-50/70 border-amber-200',
    },
    Verified: {
      label: 'Onaylı Servis',
      title: 'Servis hesabınız onaylı',
      description: 'Fırsat havuzu, teklifler ve aktif iş akışları kullanılabilir.',
      icon: ShieldCheck,
      iconClass: 'text-emerald-600',
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      panelClass: 'bg-emerald-50/70 border-emerald-200',
    },
    Suspended: {
      label: 'Askıya Alındı',
      title: 'Servis hesabınız askıda',
      description: 'Operasyon merkezi hesabınızı tekrar onaylayana kadar servis işleri kapalıdır.',
      icon: AlertTriangle,
      iconClass: 'text-red-600',
      badgeClass: 'bg-red-50 text-red-700 border-red-200',
      panelClass: 'bg-red-50/70 border-red-200',
    },
  } as const;

  return variants[status];
}

function DocumentStatusBadge({ status }: { status: 'Pending' | 'Verified' | 'Rejected' }) {
  return (
    <Badge variant="outline" className={documentStatusClass(status)}>
      {documentStatusLabel(status)}
    </Badge>
  );
}

function documentStatusClass(status: 'Pending' | 'Verified' | 'Rejected') {
  const variants = {
    Pending: 'bg-amber-50 text-amber-600 border-amber-200',
    Verified: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    Rejected: 'bg-red-50 text-red-600 border-red-200',
  };
  return variants[status];
}

function documentStatusLabel(status: 'Pending' | 'Verified' | 'Rejected') {
  const labels = {
    Pending: 'İncelemede',
    Verified: 'Onaylı',
    Rejected: 'Reddedildi',
  };
  return labels[status];
}

function SpecialtyIcon({ specialty, className }: { specialty: string; className: string }) {
  switch (specialty) {
    case 'Electric':
    case 'Elektrik':
      return <Zap className={className} />;
    case 'Mechanic':
    case 'Mekanik':
      return <Settings className={className} />;
    case 'Hydraulic':
    case 'Hidrolik':
    case 'Pneumatic':
    case 'Pnömatik':
      return <Droplets className={className} />;
    default:
      return <Wrench className={className} />;
  }
}

function MetricRow({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-slate-500">{label}</span>
      <span className={`text-lg font-bold ${color}`}>{value}</span>
    </div>
  );
}
