import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { downloadProtectedFile } from '@/lib/api';
import { formatLocation } from '@/lib/locations';
import { normalizeSearchText, serviceSpecialtyLabel } from '@/lib/serviceExpertise';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  getProviderApprovalBlocker,
  getProviderReviewSummary,
  useAdminStore,
  type ProviderDocument,
  type ServiceProvider,
} from '@/store/useAdminStore';
import {
  Building2,
  CheckCircle2,
  FileCheck,
  FileX,
  Mail,
  MapPin,
  Phone,
  Search,
  Star,
  ArrowLeft,
  AlertCircle,
  Wrench,
  ExternalLink,
} from 'lucide-react';

export default function ProviderManagement() {
  const {
    providers,
    isLoading,
    error,
    fetchProviders,
    verifyProvider,
    rejectProvider,
    toggleTrustedStatus,
    verifyDocument,
    rejectDocument,
  } = useAdminStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<ProviderDocument | null>(null);
  const [documentNotes, setDocumentNotes] = useState('');
  const [documentOpenError, setDocumentOpenError] = useState('');
  const [documentActionError, setDocumentActionError] = useState('');
  const normalizedSearchQuery = normalizeSearchText(searchQuery);

  const loadProviders = useCallback(() => {
    void fetchProviders();
  }, [fetchProviders]);

  useEffect(() => {
    loadProviders();
  }, [loadProviders]);

  const filteredProviders = providers.filter(
    (provider) =>
      normalizeSearchText(provider.name).includes(normalizedSearchQuery) ||
      normalizeSearchText(provider.city).includes(normalizedSearchQuery) ||
      normalizeSearchText(provider.district).includes(normalizedSearchQuery) ||
      provider.coverageDistricts.some((district) => normalizeSearchText(district).includes(normalizedSearchQuery)) ||
      normalizeSearchText(provider.contactName).includes(normalizedSearchQuery) ||
      provider.specialties.some((specialty) =>
        normalizeSearchText(serviceSpecialtyLabel(specialty)).includes(normalizedSearchQuery)
      ) ||
      provider.expertiseTags.some((tag) => normalizeSearchText(tag).includes(normalizedSearchQuery))
  );
  const pendingProviders = providers.filter((p) => p.status === 'Pending Verification');
  const documentReviewCount = pendingProviders.filter(
    (provider) => getProviderReviewSummary(provider).state === 'review-required'
  ).length;
  const readyApprovalCount = pendingProviders.filter(
    (provider) => getProviderReviewSummary(provider).state === 'ready'
  ).length;
  const blockedApprovalCount = pendingProviders.filter((provider) =>
    ['missing-documents', 'blocked'].includes(getProviderReviewSummary(provider).state)
  ).length;

  const handleOpenDocumentReview = (provider: ServiceProvider, document: ProviderDocument) => {
    setSelectedProvider(provider);
    setSelectedDocument(document);
    setDocumentNotes(document.notes || '');
    setDocumentOpenError('');
    setDocumentActionError('');
    setIsDialogOpen(true);
  };

  const handleVerifyDocument = async () => {
    if (selectedProvider && selectedDocument) {
      setDocumentActionError('');
      await verifyDocument(selectedProvider.id, selectedDocument.id, documentNotes);
      setIsDialogOpen(false);
    }
  };

  const handleRejectDocument = async () => {
    if (selectedProvider && selectedDocument) {
      if (!documentNotes.trim()) {
        setDocumentActionError('Reddetmek için servis sağlayıcının göreceği bir neden yazın.');
        return;
      }
      setDocumentActionError('');
      await rejectDocument(selectedProvider.id, selectedDocument.id, documentNotes);
      setIsDialogOpen(false);
    }
  };

  const handleOpenDocumentFile = async () => {
    if (!selectedDocument?.url) return;
    setDocumentOpenError('');
    try {
      const blob = await downloadProtectedFile(selectedDocument.url);
      const objectUrl = URL.createObjectURL(blob);
      window.open(objectUrl, '_blank', 'noopener,noreferrer');
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch (error) {
      setDocumentOpenError(error instanceof Error ? error.message : 'Belge açılamadı');
    }
  };

  if (isLoading && providers.length === 0) {
    return (
      <ProviderManagementShell>
        <AdminLoadingState message="Servis sağlayıcıları yükleniyor..." />
      </ProviderManagementShell>
    );
  }

  if (error) {
    return (
      <ProviderManagementShell>
        <AdminErrorState message={error} onRetry={loadProviders} />
      </ProviderManagementShell>
    );
  }

  return (
    <ProviderManagementShell>
      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
        <StatCard
          title="Toplam"
          value={providers.length}
          icon={Building2}
        />
        <StatCard
          title="Onaylı"
          value={providers.filter((p) => p.status === 'Verified').length}
          icon={CheckCircle2}
          color="text-emerald-600"
        />
        <StatCard
          title="Belge İncelemesi"
          value={documentReviewCount}
          icon={AlertCircle}
          color="text-amber-600"
        />
        <StatCard
          title="Onaya Hazır"
          value={readyApprovalCount}
          icon={FileCheck}
          color="text-emerald-600"
        />
        <StatCard
          title="Blokaj"
          value={blockedApprovalCount}
          icon={AlertCircle}
          color={blockedApprovalCount > 0 ? 'text-red-600' : 'text-slate-500'}
        />
      </div>

      {/* Search */}
      <Card className="bg-white/50 border-slate-200">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Firma adı, ilçe, şehir, yetkili veya uzmanlık ara..."
              className="pl-10 bg-slate-50 border-slate-200 text-slate-900"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Providers Table */}
      <Card className="bg-white/50 border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">
            Servis Sağlayıcıları
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-200">
                <TableHead className="text-slate-400">Firma</TableHead>
                <TableHead className="text-slate-400">İletişim</TableHead>
                <TableHead className="text-slate-400">Durum</TableHead>
                <TableHead className="text-slate-400">Yetkinlik</TableHead>
                <TableHead className="text-slate-400">Belgeler</TableHead>
                <TableHead className="text-slate-400">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProviders.map((provider) => {
                const approvalBlocker = getProviderApprovalBlocker(provider);
                const reviewSummary = getProviderReviewSummary(provider);
                const documentCounts = getDocumentCounts(provider.documents);
                return (
                <TableRow key={provider.id} className="border-slate-200">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-slate-400" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-900">
                            {provider.name}
                          </span>
                          {provider.isTrusted && (
                            <Badge className="bg-amber-50 text-amber-600 border-amber-200/30">
                              <Star className="w-3 h-3 mr-1" />
                              Güvenilir
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-2">
                          <MapPin className="w-3 h-3" />
                          {formatLocation(provider.city, provider.district) || provider.city}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm text-slate-700 flex items-center gap-2">
                        <Mail className="w-3 h-3 text-slate-500" />
                        {provider.email}
                      </div>
                      <div className="text-sm text-slate-700 flex items-center gap-2">
                        <Phone className="w-3 h-3 text-slate-500" />
                        {provider.phone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={provider.status} />
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2 min-w-48">
                      <div className="flex items-center gap-3 text-xs text-slate-400">
                        <span className="flex items-center gap-1 text-red-600">
                          <Star className="w-3 h-3" />
                          {provider.rating > 0 ? provider.rating.toFixed(1) : '-'}
                        </span>
                        <span>{provider.completedJobs} iş</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {provider.specialties.map((specialty) => (
                          <Badge
                            key={specialty}
                            variant="outline"
                            className="border-slate-200 text-slate-400 bg-slate-50/40"
                          >
                            <Wrench className="w-3 h-3 mr-1" />
                            {serviceSpecialtyLabel(specialty)}
                          </Badge>
                        ))}
                      </div>
                      {provider.expertiseTags.length > 0 && (
                        <div className="flex max-w-64 flex-wrap gap-1">
                          {provider.expertiseTags.map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="border-red-100 bg-red-50/60 text-red-600"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-400">
                          {documentCounts.verified}/{provider.documents.length}
                        </span>
                        <ProviderReviewBadge summary={reviewSummary} />
                      </div>
                      <p className="max-w-56 text-xs text-slate-500">{reviewSummary.description}</p>
                      {(documentCounts.pending > 0 || documentCounts.rejected > 0) && (
                        <div className="flex flex-wrap gap-1 text-[11px] font-medium">
                          {documentCounts.pending > 0 && (
                            <span className="rounded bg-amber-50 px-1.5 py-0.5 text-amber-700">
                              {documentCounts.pending} bekleyen
                            </span>
                          )}
                          {documentCounts.rejected > 0 && (
                            <span className="rounded bg-red-50 px-1.5 py-0.5 text-red-700">
                              {documentCounts.rejected} reddedilen
                            </span>
                          )}
                        </div>
                      )}
                      <div className="flex gap-1">
                        {provider.documents.map((doc) => (
                          <button
                            key={doc.id}
                            onClick={() => handleOpenDocumentReview(provider, doc)}
                            className={`w-2 h-2 rounded-full ${
                              doc.status === 'Verified'
                                ? 'bg-emerald-500'
                                : doc.status === 'Rejected'
                                ? 'bg-red-500'
                                : 'bg-amber-500'
                            }`}
                            title={`${doc.type}: ${doc.status}`}
                          />
                        ))}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex max-w-56 flex-col gap-2">
                      <div className="flex items-center gap-2">
                      {provider.status === 'Pending Verification' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => rejectProvider(provider.id)}
                            className="h-7 bg-red-50 text-red-600 border-red-200/30"
                          >
                            <FileX className="w-3 h-3 mr-1" />
                            Reddet
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => verifyProvider(provider.id)}
                            disabled={Boolean(approvalBlocker)}
                            title={approvalBlocker ?? 'Onayla'}
                            className="h-7 bg-emerald-600 hover:bg-emerald-700"
                          >
                            <CheckCircle2 className="w-3 h-3 mr-1" />
                            Onayla
                          </Button>
                        </>
                      )}
                      {provider.status === 'Verified' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleTrustedStatus(provider.id)}
                          className={`h-7 ${
                            provider.isTrusted
                              ? 'bg-red-50 text-red-600 border-red-200/30'
                              : 'bg-slate-50 text-slate-400 border-slate-200'
                          }`}
                        >
                          <Star className="w-3 h-3 mr-1" />
                          {provider.isTrusted ? 'Güvenilir' : 'Güvenilir Yap'}
                        </Button>
                      )}
                      </div>
                      {provider.status === 'Pending Verification' && approvalBlocker && (
                        <p className="text-xs font-medium text-amber-700">{approvalBlocker}</p>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
                );
              })}
              {filteredProviders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    Sonuç bulunamadı
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      {/* Document Review Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-white border-slate-200 text-slate-900 max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-red-600" />
              Belge İnceleme
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {selectedProvider?.name} - {selectedDocument?.type}
            </DialogDescription>
          </DialogHeader>

          {selectedDocument && (
            <div className="space-y-4">
              <div className="bg-slate-50/50 rounded-lg p-4 border border-slate-200 space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400">Belge Türü</span>
                  <span className="text-sm text-slate-900">{selectedDocument.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400">Durum</span>
                  <DocumentStatusBadge status={selectedDocument.status} />
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400">Yükleme Tarihi</span>
                  <span className="text-sm text-slate-900">
                    {new Date(selectedDocument.uploadDate).toLocaleDateString('tr-TR')}
                  </span>
                </div>
                {selectedDocument.verifiedDate && (
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-400">Onay Tarihi</span>
                    <span className="text-sm text-slate-900">
                      {new Date(selectedDocument.verifiedDate).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes" className="text-slate-700">
                  Notlar
                </Label>
                <Textarea
                  id="notes"
                  placeholder={selectedDocument.status === 'Rejected' ? 'Ret nedeni...' : 'Doğrulama notları...'}
                  value={documentNotes}
                  onChange={(e) => {
                    setDocumentNotes(e.target.value);
                    setDocumentActionError('');
                  }}
                  className="bg-slate-50 border-slate-200 text-slate-900"
                  rows={3}
                />
                {documentActionError && (
                  <p className="text-xs font-medium text-red-600">{documentActionError}</p>
                )}
              </div>

              <div className="bg-slate-50/50 rounded-lg border border-slate-200 aspect-video flex items-center justify-center">
                <div className="text-center">
                  <FileCheck className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                  <span className="block text-sm text-slate-500">{selectedDocument.originalFileName || 'Belge dosyası'}</span>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleOpenDocumentFile}
                    disabled={!selectedDocument.url}
                    className="mt-3 bg-white border-slate-200 text-slate-700"
                  >
                    <ExternalLink className="w-4 h-4 mr-2" />
                    Belgeyi Aç
                  </Button>
                  {documentOpenError && (
                    <p className="mt-2 text-xs font-medium text-red-600">{documentOpenError}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="bg-transparent border-slate-200 text-slate-700"
            >
              Kapat
            </Button>
            {selectedDocument?.status !== 'Verified' && (
              <>
                <Button
                  variant="outline"
                  onClick={handleRejectDocument}
                  className="bg-red-50 text-red-600 border-red-200/30"
                >
                  <FileX className="w-4 h-4 mr-2" />
                  Reddet
                </Button>
                <Button
                  onClick={handleVerifyDocument}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Onayla
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ProviderManagementShell>
  );
}

// ==========================================
// HELPER COMPONENTS
// ==========================================

function ProviderManagementShell({ children }: { children: ReactNode }) {
  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Servis Sağlayıcı Yönetimi</h1>
          <p className="text-slate-400 mt-1">
            Kayıtlı servis sağlayıcıları ve doğrulama durumları
          </p>
        </div>
        <div className="flex gap-3">
          <Link to="/admin/dashboard">
            <Button variant="outline" className="bg-slate-50 border-slate-200 text-slate-700">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Geri
            </Button>
          </Link>
        </div>
      </div>
      {children}
    </div>
  );
}

function AdminLoadingState({ message }: { message: string }) {
  return (
    <Card className="border-slate-200 bg-white/70">
      <CardContent className="flex items-center gap-3 p-6 text-slate-600">
        <div className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-red-600" />
        <span className="text-sm font-semibold">{message}</span>
      </CardContent>
    </Card>
  );
}

function AdminErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <Card className="border-red-200 bg-red-50">
      <CardContent className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" />
          <div>
            <h2 className="font-semibold text-red-950">Servis sağlayıcıları yüklenemedi</h2>
            <p className="mt-1 text-sm text-red-700">{message}</p>
          </div>
        </div>
        <Button type="button" onClick={onRetry} className="bg-red-600 hover:bg-red-700">
          Tekrar Dene
        </Button>
      </CardContent>
    </Card>
  );
}

function getDocumentCounts(documents: ProviderDocument[]) {
  return {
    pending: documents.filter((document) => document.status === 'Pending').length,
    verified: documents.filter((document) => document.status === 'Verified').length,
    rejected: documents.filter((document) => document.status === 'Rejected').length,
  };
}

function ProviderReviewBadge({
  summary,
}: {
  summary: ReturnType<typeof getProviderReviewSummary>;
}) {
  const variants = {
    'missing-documents': 'bg-slate-50 text-slate-600 border-slate-200',
    'review-required': 'bg-amber-50 text-amber-700 border-amber-200',
    blocked: 'bg-red-50 text-red-700 border-red-200',
    ready: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    suspended: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <Badge variant="outline" className={variants[summary.state]}>
      {summary.label}
    </Badge>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color = 'text-slate-700',
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color?: string;
}) {
  return (
    <Card className="bg-white/50 border-slate-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">{title}</p>
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
          </div>
          <Icon className={`w-8 h-8 ${color} opacity-50`} />
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: ServiceProvider['status'] }) {
  const variants = {
    'Pending Verification': {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-200/30',
      label: 'Onay Bekliyor',
    },
    Verified: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-200/30',
      label: 'Onaylı',
    },
    Suspended: {
      bg: 'bg-red-50',
      text: 'text-red-600',
      border: 'border-red-200/30',
      label: 'Reddedildi',
    },
  };

  const variant = variants[status];

  return (
    <Badge
      variant="outline"
      className={`${variant.bg} ${variant.text} ${variant.border}`}
    >
      {variant.label}
    </Badge>
  );
}

function DocumentStatusBadge({ status }: { status: ProviderDocument['status'] }) {
  const variants = {
    Pending: { bg: 'bg-amber-50', text: 'text-amber-600', label: 'Bekliyor' },
    Verified: { bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'Onaylı' },
    Rejected: { bg: 'bg-red-50', text: 'text-red-600', label: 'Reddedildi' },
  };

  const variant = variants[status];

  return (
    <Badge variant="outline" className={`${variant.bg} ${variant.text}`}>
      {variant.label}
    </Badge>
  );
}
