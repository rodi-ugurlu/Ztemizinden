import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { useAdminStore, type ServiceProvider, type ProviderDocument } from '@/store/useAdminStore';
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
  ShieldCheck,
  Wrench,
} from 'lucide-react';

export default function ProviderManagement() {
  const { providers, fetchProviders, toggleTrustedStatus, verifyDocument, rejectDocument } = useAdminStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<ServiceProvider | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<ProviderDocument | null>(null);
  const [documentNotes, setDocumentNotes] = useState('');

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  const filteredProviders = providers.filter(
    (provider) =>
      provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      provider.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      provider.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      provider.specialties.some((specialty) => specialty.toLowerCase().includes(searchQuery.toLowerCase()))
  );
  const verifiedProviders = providers.filter((p) => p.status === 'Verified');
  const averageRating =
    verifiedProviders.length > 0
      ? verifiedProviders.reduce((sum, provider) => sum + provider.rating, 0) / verifiedProviders.length
      : 0;

  const handleOpenDocumentReview = (provider: ServiceProvider, document: ProviderDocument) => {
    setSelectedProvider(provider);
    setSelectedDocument(document);
    setDocumentNotes(document.notes || '');
    setIsDialogOpen(true);
  };

  const handleVerifyDocument = async () => {
    if (selectedProvider && selectedDocument) {
      await verifyDocument(selectedProvider.id, selectedDocument.id, documentNotes);
      setIsDialogOpen(false);
    }
  };

  const handleRejectDocument = async () => {
    if (selectedProvider && selectedDocument) {
      await rejectDocument(selectedProvider.id, selectedDocument.id, documentNotes);
      setIsDialogOpen(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
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
          title="Bekleyen"
          value={providers.filter((p) => p.status === 'Pending Verification').length}
          icon={AlertCircle}
          color="text-amber-600"
        />
        <StatCard
          title="Güvenilir"
          value={providers.filter((p) => p.isTrusted).length}
          icon={Star}
          color="text-indigo-600"
        />
        <StatCard
          title="Ort. Puan"
          value={averageRating.toFixed(1)}
          icon={ShieldCheck}
          color="text-amber-600"
        />
      </div>

      {/* Search */}
      <Card className="bg-white/50 border-slate-200">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Firma adı, şehir, yetkili veya uzmanlık ara..."
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
              {filteredProviders.map((provider) => (
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
                          {provider.city}
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
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-slate-400">
                        {provider.documents.filter((d) => d.status === 'Verified').length}/
                        {provider.documents.length}
                      </span>
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
                    <div className="flex items-center gap-2">
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
                  </TableCell>
                </TableRow>
              ))}
              {filteredProviders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    Sonuç bulunamadı
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
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
                  placeholder="Doğrulama notları..."
                  value={documentNotes}
                  onChange={(e) => setDocumentNotes(e.target.value)}
                  className="bg-slate-50 border-slate-200 text-slate-900"
                  rows={3}
                />
              </div>

              <div className="bg-slate-50/50 rounded-lg border border-slate-200 aspect-video flex items-center justify-center">
                <div className="text-center">
                  <FileCheck className="w-12 h-12 text-slate-600 mx-auto mb-2" />
                  <span className="text-sm text-slate-500">Belge Önizlemesi</span>
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
    </div>
  );
}

// ==========================================
// HELPER COMPONENTS
// ==========================================

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
      label: 'Askıda',
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
