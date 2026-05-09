import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
} from 'lucide-react';

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
  } = useServiceStore();
  const stats = useTicketStats();

  useEffect(() => {
    void resolveProviderSession(user);
  }, [user, resolveProviderSession]);

  useEffect(() => {
    if (currentProviderId) {
      fetchMyJobs();
      fetchProviderProfile();
    }
  }, [currentProviderId, fetchMyJobs, fetchProviderProfile]);

  const providerProfile = {
    companyName: serviceProviderProfile?.name || user?.name || 'Servis sağlayıcı',
    contactName: serviceProviderProfile?.contactName || '-',
    email: serviceProviderProfile?.email || user?.email || '-',
    phone: serviceProviderProfile?.phone || '-',
    city: serviceProviderProfile?.city || '-',
    specialties: serviceProviderProfile?.specialties ?? [],
    rating: serviceProviderProfile?.rating ?? 0,
    memberSince: serviceProviderProfile?.createdAt ? new Date(serviceProviderProfile.createdAt).getFullYear().toString() : '-',
    documents: serviceProviderProfile?.documents ?? [],
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Ekip & Profil</h1>
        <p className="text-slate-500 mt-1">
          Firma bilgileriniz, ekip üyeleriniz ve performans metrikleri
        </p>
      </div>

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
                  {providerProfile.city}
                </CardDescription>
              </div>
              <div className="ml-auto flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-full">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <span className="text-sm font-bold text-amber-700">{providerProfile.rating}</span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
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
                  <p className="text-xs text-slate-400">Şehir</p>
                  <p className="font-medium text-slate-700">{providerProfile.city}</p>
                </div>
              </div>
            </div>

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
                    {specialty}
                  </Badge>
                ))}
              </div>
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
                    <Badge
                      key={document.id}
                      variant="outline"
                      className="bg-emerald-50 text-emerald-700 border-emerald-200 px-3 py-1"
                    >
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
          <CardDescription>Başvuru sırasında yüklenen belgeler ve inceleme durumları</CardDescription>
        </CardHeader>
        <CardContent>
          {providerProfile.documents.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {providerProfile.documents.map((document) => (
                <div key={document.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
                  <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center text-red-600">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 text-sm">{document.type}</p>
                    <p className="text-xs text-slate-400">{document.originalFileName || document.url || 'Dosya'}</p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      document.status === 'Verified'
                        ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                        : document.status === 'Rejected'
                        ? 'bg-red-50 text-red-600 border-red-200'
                        : 'bg-amber-50 text-amber-600 border-amber-200'
                    }
                  >
                    {document.status}
                  </Badge>
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
