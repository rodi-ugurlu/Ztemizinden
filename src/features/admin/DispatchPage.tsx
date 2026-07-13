import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatLocation } from '@/lib/locations';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  useAdminStore,
  type GlobalTicket,
  type BillingDisputeDecision,
  type ProviderMatch,
  type SlaStatus,
} from '@/store/useAdminStore';
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  CheckCircle2,
  Filter,
  MapPin,
  Search,
  ShieldCheck,
  Star,
  Timer,
  Truck,
  User,
  Wrench,
  Zap,
  Droplets,
  Settings,
} from 'lucide-react';

export default function DispatchPage() {
  const {
    tickets,
    providers,
    isLoading,
    error,
    fetchProviders,
    fetchQueue,
    assignTicket,
    resolveBillingDispute,
    getProviderMatches,
    getSlaStatus,
    getMetrics,
  } = useAdminStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<GlobalTicket | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [assignError, setAssignError] = useState('');
  const [isBillingDialogOpen, setIsBillingDialogOpen] = useState(false);
  const [billingDecision, setBillingDecision] = useState<BillingDisputeDecision>('REQUEST_REVISION');
  const [billingNote, setBillingNote] = useState('');
  const [billingError, setBillingError] = useState('');
  const [isResolvingBilling, setIsResolvingBilling] = useState(false);
  const metrics = getMetrics();
  const selectedMatches = selectedTicket ? getProviderMatches(selectedTicket.id) : [];

  const loadDispatch = useCallback(async () => {
    await fetchProviders();
    if (useAdminStore.getState().error) return;
    await fetchQueue();
  }, [fetchProviders, fetchQueue]);

  useEffect(() => {
    void loadDispatch();
  }, [loadDispatch]);

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.customerCompany.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.customerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
    const matchesCategory = filterCategory === 'all' || ticket.category === filterCategory;
    const matchesPriority = filterPriority === 'all' || ticket.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesCategory && matchesPriority;
  });

  const handleAssignTicket = async () => {
    if (selectedTicket && selectedProvider) {
      const provider = providers.find((p) => p.id === selectedProvider);
      if (provider) {
        const match = selectedMatches.find((candidate) => candidate.provider.id === provider.id);
        const opsNote = match
          ? `Ops önerisi: ${match.score}/100 - ${match.reasons.join(', ')}. ETA ${match.etaMinutes} dk.`
          : undefined;

        setIsAssigning(true);
        setAssignError('');
        try {
          await assignTicket(selectedTicket.id, provider.id, provider.name, opsNote);
          setIsAssignDialogOpen(false);
          setSelectedProvider('');
          setSelectedTicket(null);
        } catch (assignmentError) {
          setAssignError(assignmentError instanceof Error ? assignmentError.message : 'Atama tamamlanamadı');
        } finally {
          setIsAssigning(false);
        }
      }
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterStatus('all');
    setFilterCategory('all');
    setFilterPriority('all');
  };

  const openBillingDialog = (ticket: GlobalTicket) => {
    setSelectedTicket(ticket);
    setBillingDecision('REQUEST_REVISION');
    setBillingNote('');
    setBillingError('');
    setIsBillingDialogOpen(true);
  };

  const handleResolveBilling = async () => {
    if (!selectedTicket || !billingNote.trim()) return;
    setIsResolvingBilling(true);
    setBillingError('');
    try {
      await resolveBillingDispute(selectedTicket.id, billingDecision, billingNote.trim());
      setIsBillingDialogOpen(false);
      setSelectedTicket(null);
    } catch (resolutionError) {
      setBillingError(resolutionError instanceof Error ? resolutionError.message : 'İtiraz sonuçlandırılamadı');
    } finally {
      setIsResolvingBilling(false);
    }
  };

  const hasActiveFilters =
    searchQuery || filterStatus !== 'all' || filterCategory !== 'all' || filterPriority !== 'all';

  const openAssignDialog = (ticket: GlobalTicket) => {
    const bestMatch = getProviderMatches(ticket.id)[0];

    setSelectedTicket(ticket);
    setSelectedProvider(bestMatch?.provider.id ?? '');
    setAssignError('');
    setIsAssignDialogOpen(true);
  };

  if (isLoading && providers.length === 0 && tickets.length === 0) {
    return (
      <DispatchPageShell>
        <AdminLoadingState message="Sevk kuyruğu yükleniyor..." />
      </DispatchPageShell>
    );
  }

  if (error) {
    return (
      <DispatchPageShell>
        <AdminErrorState message={error} onRetry={() => void loadDispatch()} />
      </DispatchPageShell>
    );
  }

  return (
    <DispatchPageShell>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <OpsMetricCard
          title="Atama Bekleyen"
          value={metrics.unassignedOpenTickets}
          icon={Truck}
          tone="text-amber-600"
        />
        <OpsMetricCard
          title="SLA İhlali"
          value={metrics.slaBreaches}
          icon={AlertTriangle}
          tone="text-red-600"
        />
        <OpsMetricCard
          title="Kritik Açık"
          value={metrics.criticalTickets}
          icon={Zap}
          tone="text-orange-600"
        />
        <OpsMetricCard
          title="Ort. Yanıt"
          value={`${metrics.averageResponseTime} dk`}
          icon={Timer}
          tone="text-blue-600"
        />
      </div>

      {/* Filters */}
      <Card className="bg-white/50 border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-700">
            <Filter className="w-4 h-4" />
            Filtreler
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                placeholder="Ara..."
                className="pl-10 bg-slate-50 border-slate-200 text-slate-900"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="bg-slate-50 border-slate-200 text-slate-900">
                <SelectValue placeholder="Durum" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                <SelectItem value="Open">Açık</SelectItem>
                <SelectItem value="Offered">Teklif</SelectItem>
                <SelectItem value="In Progress">Devam</SelectItem>
                <SelectItem value="Resolved">Çözüldü</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="bg-slate-50 border-slate-200 text-slate-900">
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Kategoriler</SelectItem>
                <SelectItem value="Electric">Elektrik</SelectItem>
                <SelectItem value="Mechanic">Mekanik</SelectItem>
                <SelectItem value="Pneumatic">Pnomatik</SelectItem>
                <SelectItem value="Hydraulic">Hidrolik</SelectItem>
                <SelectItem value="Software">Yazılım</SelectItem>
                <SelectItem value="General">Genel</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="bg-slate-50 border-slate-200 text-slate-900">
                <SelectValue placeholder="Öncelik" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Öncelikler</SelectItem>
                <SelectItem value="Critical">Kritik</SelectItem>
                <SelectItem value="High">Yüksek</SelectItem>
                <SelectItem value="Medium">Orta</SelectItem>
                <SelectItem value="Low">Düşük</SelectItem>
              </SelectContent>
            </Select>
            {hasActiveFilters && (
              <Button variant="ghost" onClick={clearFilters} className="text-slate-400 hover:text-red-600">
                Filtreleri Temizle
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-slate-400">
          <span className="text-slate-900 font-medium">{filteredTickets.length}</span> talep gösteriliyor
        </p>
      </div>

      {/* Tickets Table */}
      <Card className="bg-white/50 border-slate-200">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-200 hover:bg-transparent">
                <TableHead className="text-slate-400">Talep</TableHead>
                <TableHead className="text-slate-400">Fabrika/İşletme</TableHead>
                <TableHead className="text-slate-400">SLA</TableHead>
                <TableHead className="text-slate-400">Kategori</TableHead>
                <TableHead className="text-slate-400">Öncelik</TableHead>
                <TableHead className="text-slate-400">Durum</TableHead>
                <TableHead className="text-slate-400">Önerilen</TableHead>
                <TableHead className="text-slate-400">Atanan</TableHead>
                <TableHead className="text-slate-400">İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTickets.map((ticket) => {
                const recommendedMatch = getProviderMatches(ticket.id)[0];
                const slaStatus = getSlaStatus(ticket.id);

                return (
                  <TableRow key={ticket.id} className="border-slate-200">
                    <TableCell>
                      <div>
                        <p className="font-medium text-slate-900 max-w-xs truncate">{ticket.title}</p>
                        <p className="text-xs text-slate-500 font-mono">#{ticket.id.split('-')[1]}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-500 shrink-0" />
                        <div>
                          <p className="text-sm text-slate-700">{ticket.customerCompany}</p>
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {ticket.customerLocation ?? ticket.customerName}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <SlaBadge status={slaStatus} />
                    </TableCell>
                    <TableCell>
                      <CategoryBadge category={ticket.category} />
                    </TableCell>
                    <TableCell>
                      <PriorityBadge priority={ticket.priority} />
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={ticket.status} />
                    </TableCell>
                    <TableCell>
                      {recommendedMatch ? <RecommendedProvider match={recommendedMatch} /> : <span className="text-sm text-slate-500">-</span>}
                    </TableCell>
                    <TableCell>
                      {ticket.assignedProviderName ? (
                        <div>
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-slate-500" />
                            <span className="text-sm text-slate-700">{ticket.assignedProviderName}</span>
                          </div>
                          {ticket.opsNote && <p className="text-xs text-slate-500 mt-1 max-w-44 truncate">{ticket.opsNote}</p>}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-500">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {ticket.billingStatus === 'DISPUTED' ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-amber-300 text-amber-700 hover:bg-amber-50"
                          onClick={() => openBillingDialog(ticket)}
                        >
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          İtirazı Çöz
                        </Button>
                      ) : ticket.status === 'Open' ? (
                        <Button
                          size="sm"
                          className="bg-red-600 hover:bg-red-700"
                          onClick={() => openAssignDialog(ticket)}
                        >
                          <Truck className="w-3 h-3 mr-1" />
                          Ata
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                );
              })}
              {filteredTickets.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-8 text-slate-500">
                    Filtrelere uygun talep bulunamadı
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      {/* Assign Ticket Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="bg-white border-slate-200 text-slate-900 max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-red-600" />
              Servis Sağlayıcı Ata
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {selectedTicket?.title}
            </DialogDescription>
          </DialogHeader>

          {selectedTicket && (
            <div className="space-y-4">
              <div className="bg-slate-50/50 rounded-lg p-4 border border-slate-200 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400">Fabrika/İşletme</span>
                  <span className="text-sm text-slate-900">{selectedTicket.customerCompany}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400">Varlık</span>
                  <span className="text-sm text-slate-900">{selectedTicket.assetName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400">Lokasyon</span>
                  <span className="text-sm text-slate-900">{selectedTicket.customerLocation ?? selectedTicket.customerCity}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400">Kategori</span>
                  <CategoryBadge category={selectedTicket.category} />
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400">SLA</span>
                  <SlaBadge status={getSlaStatus(selectedTicket.id)} />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700">Önerilen Eşleşmeler</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {selectedMatches.slice(0, 3).map((match) => (
                    <button
                      key={match.provider.id}
                      type="button"
                      onClick={() => setSelectedProvider(match.provider.id)}
                      className={`text-left rounded-lg border p-3 transition-colors ${
                        selectedProvider === match.provider.id
                          ? 'border-red-200 bg-red-50'
                          : 'border-slate-200 bg-slate-50/40 hover:border-slate-200'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{match.provider.name}</p>
                          <p className="text-xs text-slate-500">
                            {formatLocation(match.provider.city, match.provider.district) || match.provider.city} · ETA {match.etaMinutes} dk
                          </p>
                        </div>
                        <Badge className="bg-blue-50 text-blue-600 border-blue-200/30">
                          {match.score}/100
                        </Badge>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1">
                        {match.reasons.slice(0, 3).map((reason) => (
                          <Badge key={reason} variant="outline" className="border-slate-200 text-slate-400">
                            {reason}
                          </Badge>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-700">Servis Sağlayıcı Seçin</Label>
                <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                  <SelectTrigger className="bg-slate-50 border-slate-200 text-slate-900">
                    <SelectValue placeholder="Sağlayıcı seçin..." />
                  </SelectTrigger>
                  <SelectContent>
                    {providers
                      .filter((p) => p.status === 'Verified')
                      .map((provider) => (
                        <SelectItem key={provider.id} value={provider.id}>
                          <div className="flex items-center justify-between w-full">
                            <span>{provider.name}</span>
                            {provider.isTrusted && (
                              <Badge className="ml-2 bg-amber-50 text-amber-600">Güvenilir</Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              {assignError && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                  {assignError}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsAssignDialogOpen(false);
                setSelectedProvider('');
                setAssignError('');
              }}
              className="bg-transparent border-slate-200 text-slate-700"
            >
              İptal
            </Button>
            <Button
              onClick={handleAssignTicket}
              disabled={!selectedProvider || isAssigning}
              className="bg-red-600 hover:bg-red-700"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              {isAssigning ? 'Atanıyor...' : 'Ata'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isBillingDialogOpen} onOpenChange={setIsBillingDialogOpen}>
        <DialogContent className="bg-white border-slate-200 text-slate-900 max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600" />
              Fatura İtirazını Sonuçlandır
            </DialogTitle>
            <DialogDescription>{selectedTicket?.title}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Operasyon kararı</Label>
              <Select
                value={billingDecision}
                onValueChange={(value) => setBillingDecision(value as BillingDisputeDecision)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="REQUEST_REVISION">Servisten revizyon iste</SelectItem>
                  <SelectItem value="APPROVE">Mevcut faturayı onayla ve kapat</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="billing-resolution-note">Karar notu</Label>
              <Textarea
                id="billing-resolution-note"
                value={billingNote}
                onChange={(event) => setBillingNote(event.target.value)}
                maxLength={2000}
                placeholder="Kararın gerekçesini ve servisten beklenen düzeltmeyi yazın..."
              />
            </div>
            {billingError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
                {billingError}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBillingDialogOpen(false)}>
              Vazgeç
            </Button>
            <Button
              onClick={() => void handleResolveBilling()}
              disabled={!billingNote.trim() || isResolvingBilling}
              className={billingDecision === 'APPROVE' ? 'bg-green-600 hover:bg-green-700' : 'bg-amber-600 hover:bg-amber-700'}
            >
              {isResolvingBilling ? 'Kaydediliyor...' : 'Kararı Uygula'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DispatchPageShell>
  );
}

// ==========================================
// HELPER COMPONENTS
// ==========================================

function DispatchPageShell({ children }: { children: ReactNode }) {
  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Sevk Merkezi</h1>
          <p className="text-slate-400 mt-1">SLA riski, lokasyon ve servis eşleşmesine göre operasyon yönetimi</p>
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
          <AlertTriangle className="mt-0.5 h-5 w-5 text-red-600" />
          <div>
            <h2 className="font-semibold text-red-950">Sevk kuyruğu yüklenemedi</h2>
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

function OpsMetricCard({
  title,
  value,
  icon: Icon,
  tone,
}: {
  title: string;
  value: number | string;
  icon: React.ElementType;
  tone: string;
}) {
  return (
    <Card className="bg-white/50 border-slate-200">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">{title}</p>
            <p className={`text-2xl font-bold ${tone}`}>{value}</p>
          </div>
          <Icon className={`w-8 h-8 ${tone} opacity-50`} />
        </div>
      </CardContent>
    </Card>
  );
}

function SlaBadge({ status }: { status: SlaStatus }) {
  const variants = {
    Healthy: {
      bg: 'bg-emerald-50',
      text: 'text-emerald-600',
      border: 'border-emerald-200/30',
      label: 'Sağlıklı',
    },
    Watch: {
      bg: 'bg-amber-50',
      text: 'text-amber-600',
      border: 'border-amber-200/30',
      label: 'Risk',
    },
    Breach: {
      bg: 'bg-red-50',
      text: 'text-red-600',
      border: 'border-red-200/30',
      label: 'İhlal',
    },
  };
  const variant = variants[status];

  return (
    <Badge variant="outline" className={`${variant.bg} ${variant.text} ${variant.border}`}>
      <Timer className="w-3 h-3 mr-1" />
      {variant.label}
    </Badge>
  );
}

function RecommendedProvider({ match }: { match: ProviderMatch }) {
  return (
    <div className="min-w-44">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-red-600" />
        <span className="text-sm text-slate-700 truncate">{match.provider.name}</span>
      </div>
      <p className="mt-1 truncate text-xs text-slate-500">
        {formatLocation(match.provider.city, match.provider.district) || match.provider.city}
      </p>
      <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
        <span>{match.score}/100</span>
        <span>ETA {match.etaMinutes} dk</span>
        {match.provider.rating > 0 && (
          <span className="flex items-center gap-1 text-red-600">
            <Star className="w-3 h-3" />
            {match.provider.rating.toFixed(1)}
          </span>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: GlobalTicket['status'] }) {
  const variants = {
    Open: { bg: 'bg-blue-50', text: 'text-blue-600', label: 'Açık' },
    Offered: { bg: 'bg-amber-50', text: 'text-amber-600', label: 'Teklif' },
    'In Progress': { bg: 'bg-indigo-50', text: 'text-indigo-600', label: 'Devam' },
    Resolved: { bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'Çözüldü' },
    Closed: { bg: 'bg-slate-100', text: 'text-slate-400', label: 'Kapalı' },
    Cancelled: { bg: 'bg-red-50', text: 'text-red-600', label: 'İptal' },
  };

  const variant = variants[status];

  return (
    <Badge variant="outline" className={`${variant.bg} ${variant.text}`}>
      {variant.label}
    </Badge>
  );
}

function PriorityBadge({ priority }: { priority: GlobalTicket['priority'] }) {
  const variants = {
    Critical: { bg: 'bg-red-50', text: 'text-red-600', label: 'Kritik' },
    High: { bg: 'bg-orange-50', text: 'text-orange-600', label: 'Yüksek' },
    Medium: { bg: 'bg-amber-50', text: 'text-amber-600', label: 'Orta' },
    Low: { bg: 'bg-slate-100', text: 'text-slate-500', label: 'Düşük' },
  };

  const variant = variants[priority];

  return (
    <Badge variant="outline" className={`${variant.bg} ${variant.text}`}>
      {variant.label}
    </Badge>
  );
}

function CategoryBadge({ category }: { category: GlobalTicket['category'] }) {
  const icons: Record<string, React.ElementType> = {
    Electric: Zap,
    Mechanic: Settings,
    Pneumatic: Droplets,
    Hydraulic: Droplets,
    Software: Settings,
    General: Wrench,
  };

  const categoryLabels: Record<string, string> = {
    Electric: 'Elektrik',
    Mechanic: 'Mekanik',
    Pneumatic: 'Pnömatik',
    Hydraulic: 'Hidrolik',
    Software: 'Yazılım',
    General: 'Genel',
  };

  const Icon = icons[category] || Wrench;

  return (
    <div className="flex items-center gap-1.5">
      <Icon className="w-4 h-4 text-slate-500" />
      <span className="text-sm text-slate-700">{categoryLabels[category] || category}</span>
    </div>
  );
}
