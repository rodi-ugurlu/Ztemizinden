import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { useAdminStore, type GlobalTicket } from '@/store/useAdminStore';
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Clock,
  Filter,
  MapPin,
  Search,
  Truck,
  User,
  Wrench,
  Zap,
  Droplets,
  Settings,
  AlertCircle,
} from 'lucide-react';

export default function DispatchPage() {
  const { tickets, providers, assignTicket } = useAdminStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [selectedTicket, setSelectedTicket] = useState<GlobalTicket | null>(null);
  const [isAssignDialogOpen, setIsAssignDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>('');

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

  const handleAssignTicket = () => {
    if (selectedTicket && selectedProvider) {
      const provider = providers.find((p) => p.id === selectedProvider);
      if (provider) {
        assignTicket(selectedTicket.id, provider.id, provider.name);
        setIsAssignDialogOpen(false);
        setSelectedProvider('');
        setSelectedTicket(null);
      }
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterStatus('all');
    setFilterCategory('all');
    setFilterPriority('all');
  };

  const hasActiveFilters =
    searchQuery || filterStatus !== 'all' || filterCategory !== 'all' || filterPriority !== 'all';

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100">Sevk Merkezi</h1>
          <p className="text-slate-400 mt-1">Tüm servis taleplerinin yönetimi ve atama</p>
        </div>
        <div className="flex gap-3">
          <Link to="/admin/dashboard">
            <Button variant="outline" className="bg-slate-800 border-slate-700 text-slate-300">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Geri
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2 text-slate-300">
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
                className="pl-10 bg-slate-800 border-slate-700 text-slate-100"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
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
              <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
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
              <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
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
              <Button variant="ghost" onClick={clearFilters} className="text-slate-400 hover:text-slate-200">
                Filtreleri Temizle
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-slate-400">
          <span className="text-slate-200 font-medium">{filteredTickets.length}</span> talep gösteriliyor
        </p>
      </div>

      {/* Tickets Table */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800 hover:bg-transparent">
                <TableHead className="text-slate-400">Talep</TableHead>
                <TableHead className="text-slate-400">Müşteri</TableHead>
                <TableHead className="text-slate-400">Kategori</TableHead>
                <TableHead className="text-slate-400">Öncelik</TableHead>
                <TableHead className="text-slate-400">Durum</TableHead>
                <TableHead className="text-slate-400">Atanan</TableHead>
                <TableHead className="text-slate-400">İşlem</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTickets.map((ticket) => (
                <TableRow key={ticket.id} className="border-slate-800">
                  <TableCell>
                    <div>
                      <p className="font-medium text-slate-200 max-w-xs truncate">{ticket.title}</p>
                      <p className="text-xs text-slate-500 font-mono">#{ticket.id.split('-')[1]}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-slate-500" />
                      <div>
                        <p className="text-sm text-slate-300">{ticket.customerCompany}</p>
                        <p className="text-xs text-slate-500">{ticket.customerName}</p>
                      </div>
                    </div>
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
                    {ticket.assignedProviderName ? (
                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-slate-500" />
                        <span className="text-sm text-slate-300">{ticket.assignedProviderName}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-slate-500">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {ticket.status === 'Open' && (
                      <Button
                        size="sm"
                        className="bg-indigo-600 hover:bg-indigo-500"
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setIsAssignDialogOpen(true);
                        }}
                      >
                        <Truck className="w-3 h-3 mr-1" />
                        Ata
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filteredTickets.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                    Filtrelere uygun talep bulunamadı
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Assign Ticket Dialog */}
      <Dialog open={isAssignDialogOpen} onOpenChange={setIsAssignDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-slate-100 max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-indigo-400" />
              Servis Sağlayıcı Ata
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {selectedTicket?.title}
            </DialogDescription>
          </DialogHeader>

          {selectedTicket && (
            <div className="space-y-4">
              <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-800 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400">Müşteri</span>
                  <span className="text-sm text-slate-200">{selectedTicket.customerCompany}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400">Varlık</span>
                  <span className="text-sm text-slate-200">{selectedTicket.assetName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-400">Kategori</span>
                  <CategoryBadge category={selectedTicket.category} />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">Servis Sağlayıcı Seçin</Label>
                <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                  <SelectTrigger className="bg-slate-800 border-slate-700 text-slate-100">
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
                              <Badge className="ml-2 bg-yellow-500/20 text-yellow-400">Güvenilir</Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter className="gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setIsAssignDialogOpen(false);
                setSelectedProvider('');
              }}
              className="bg-transparent border-slate-700 text-slate-300"
            >
              İptal
            </Button>
            <Button
              onClick={handleAssignTicket}
              disabled={!selectedProvider}
              className="bg-indigo-600 hover:bg-indigo-500"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Ata
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ==========================================
// HELPER COMPONENTS
// ==========================================

function StatusBadge({ status }: { status: GlobalTicket['status'] }) {
  const variants = {
    Open: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Açık' },
    Offered: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Teklif' },
    'In Progress': { bg: 'bg-indigo-500/20', text: 'text-indigo-400', label: 'Devam' },
    Resolved: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Çözüldü' },
    Closed: { bg: 'bg-slate-700', text: 'text-slate-400', label: 'Kapalı' },
    Cancelled: { bg: 'bg-rose-500/20', text: 'text-rose-400', label: 'İptal' },
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
    Critical: { bg: 'bg-rose-500/20', text: 'text-rose-400', label: 'Kritik' },
    High: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Yüksek' },
    Medium: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Orta' },
    Low: { bg: 'bg-slate-700', text: 'text-slate-400', label: 'Düşük' },
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

  const Icon = icons[category] || Wrench;

  return (
    <div className="flex items-center gap-1.5">
      <Icon className="w-4 h-4 text-slate-500" />
      <span className="text-sm text-slate-300">{category}</span>
    </div>
  );
}
