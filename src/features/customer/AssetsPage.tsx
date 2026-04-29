import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useCustomerStore,
  type Asset,
  type AssetType,
  type AssetStatus,
} from '@/store/useCustomerStore';
import {
  Plus,
  Search,
  Building2,
  Home,
  Briefcase,
  Wrench,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Package,
  Calendar,
  Tag,
  Factory,
} from 'lucide-react';

/**
 * AssetsPage Component
 *
 * Asset Registry / Varlık Ağacı for Customer Portal.
 * Displays all registered assets with filtering and add functionality.
 */
export default function AssetsPage() {
  const { assets, addAsset } = useCustomerStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<AssetType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<AssetStatus | 'all'>('all');
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Filter assets
  const filteredAssets = assets.filter((asset) => {
    const matchesSearch =
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.tagNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.brand.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || asset.type === filterType;
    const matchesStatus = filterStatus === 'all' || asset.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Asset Registry</h1>
          <p className="text-slate-500 mt-1">
            Manage your equipment and facilities in one place
          </p>
        </div>
        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
          <SheetTrigger asChild>
            <Button className="bg-red-600 hover:bg-red-700">
              <Plus className="w-4 h-4 mr-2" />
              Register New Asset
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
            <NewAssetForm
              onSubmit={(asset) => {
                addAsset(asset);
                setIsSheetOpen(false);
              }}
              onCancel={() => setIsSheetOpen(false)}
            />
          </SheetContent>
        </Sheet>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by name, tag number, or brand..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <Select
                value={filterType}
                onValueChange={(v) => setFilterType(v as AssetType | 'all')}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Filter by type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Facility">Facility</SelectItem>
                  <SelectItem value="SME">SME</SelectItem>
                  <SelectItem value="Home">Home</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filterStatus}
                onValueChange={(v) => setFilterStatus(v as AssetStatus | 'all')}
              >
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Under Maintenance">Under Maintenance</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredAssets.map((asset) => (
          <AssetCard key={asset.id} asset={asset} />
        ))}
        {filteredAssets.length === 0 && (
          <div className="col-span-full text-center py-16">
            <Package className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-700">No assets found</h3>
            <p className="text-slate-500 mt-1">
              Try adjusting your filters or register a new asset
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Asset Card Component
 */
function AssetCard({ asset }: { asset: Asset }) {
  const Icon = asset.type === 'Facility' ? Factory : asset.type === 'SME' ? Building2 : Home;
  const statusColor =
    asset.status === 'Active'
      ? 'bg-emerald-100 text-emerald-700'
      : asset.status === 'Under Maintenance'
      ? 'bg-amber-100 text-amber-700'
      : 'bg-slate-100 text-slate-600';

  const warrantyDaysLeft = Math.ceil(
    (new Date(asset.warrantyEndDate).getTime() - new Date().getTime()) /
      (1000 * 60 * 60 * 24)
  );
  const isWarrantyExpiring = warrantyDaysLeft > 0 && warrantyDaysLeft < 90;
  const isWarrantyExpired = warrantyDaysLeft < 0;

  return (
    <Card className="group hover:shadow-lg transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-50 rounded-lg flex items-center justify-center">
              <Icon className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <CardTitle className="text-lg font-semibold text-slate-900">
                {asset.name}
              </CardTitle>
              <CardDescription className="text-xs font-mono text-slate-500">
                {asset.tagNo}
              </CardDescription>
            </div>
          </div>
          <Badge variant="secondary" className={statusColor}>
            {asset.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Asset Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-500 text-xs uppercase tracking-wider">Brand</p>
            <p className="font-medium text-slate-700">{asset.brand}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs uppercase tracking-wider">Model</p>
            <p className="font-medium text-slate-700">{asset.model}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs uppercase tracking-wider">Serial Number</p>
            <p className="font-medium text-slate-700 font-mono text-xs">{asset.serialNumber}</p>
          </div>
          <div>
            <p className="text-slate-500 text-xs uppercase tracking-wider">Type</p>
            <p className="font-medium text-slate-700">{asset.type}</p>
          </div>
        </div>

        {/* Warranty Status */}
        <div
          className={`p-3 rounded-lg border ${
            isWarrantyExpired
              ? 'bg-rose-50 border-rose-200'
              : isWarrantyExpiring
              ? 'bg-amber-50 border-amber-200'
              : 'bg-emerald-50 border-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {isWarrantyExpired ? (
              <AlertCircle className="w-4 h-4 text-rose-600" />
            ) : isWarrantyExpiring ? (
              <AlertCircle className="w-4 h-4 text-amber-600" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            )}
            <span
              className={`text-sm font-medium ${
                isWarrantyExpired
                  ? 'text-rose-700'
                  : isWarrantyExpiring
                  ? 'text-amber-700'
                  : 'text-emerald-700'
              }`}
            >
              {isWarrantyExpired
                ? 'Warranty Expired'
                : isWarrantyExpiring
                ? `Warranty expires in ${warrantyDaysLeft} days`
                : 'Under Warranty'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Until {new Date(asset.warrantyEndDate).toLocaleDateString()}
          </p>
        </div>

        {/* Location */}
        {asset.location && (
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <Tag className="w-4 h-4" />
            <span>
              {asset.location}
              {asset.department && ` • ${asset.department}`}
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Link to={`/customer/tickets/create?assetId=${asset.id}`} className="flex-1">
            <Button variant="outline" className="w-full" size="sm">
              <Wrench className="w-4 h-4 mr-2" />
              Service Request
            </Button>
          </Link>
          <Button variant="ghost" size="sm" className="text-red-600">
            Details <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * New Asset Form Component
 */
interface NewAssetFormProps {
  onSubmit: (asset: Omit<Asset, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

function NewAssetForm({ onSubmit, onCancel }: NewAssetFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    tagNo: '',
    type: '' as AssetType | '',
    brand: '',
    model: '',
    serialNumber: '',
    purchaseDate: '',
    warrantyEndDate: '',
    status: 'Active' as AssetStatus,
    location: '',
    department: '',
    description: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.tagNo && formData.type) {
      onSubmit({
        name: formData.name,
        tagNo: formData.tagNo,
        type: formData.type as AssetType,
        brand: formData.brand || 'N/A',
        model: formData.model || 'N/A',
        serialNumber: formData.serialNumber || 'N/A',
        purchaseDate: formData.purchaseDate || new Date().toISOString().split('T')[0],
        warrantyEndDate: formData.warrantyEndDate || new Date().toISOString().split('T')[0],
        status: formData.status,
        location: formData.location || undefined,
        department: formData.department || undefined,
        description: formData.description || undefined,
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <SheetHeader>
        <SheetTitle>Register New Asset</SheetTitle>
        <SheetDescription>
          Add a new equipment or facility to your asset registry
        </SheetDescription>
      </SheetHeader>

      <div className="space-y-4">
        {/* Asset Type */}
        <div className="space-y-2">
          <Label htmlFor="type">
            Asset Type <span className="text-rose-500">*</span>
          </Label>
          <Select
            value={formData.type}
            onValueChange={(v) => setFormData({ ...formData, type: v as AssetType })}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select asset type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Facility">
                <div className="flex items-center gap-2">
                  <Factory className="w-4 h-4" />
                  Facility - Industrial equipment, HVAC, compressors
                </div>
              </SelectItem>
              <SelectItem value="SME">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  SME - Small business machinery
                </div>
              </SelectItem>
              <SelectItem value="Home">
                <div className="flex items-center gap-2">
                  <Home className="w-4 h-4" />
                  Home - Residential equipment
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Asset Name */}
        <div className="space-y-2">
          <Label htmlFor="name">
            Asset Name <span className="text-rose-500">*</span>
          </Label>
          <Input
            id="name"
            placeholder="e.g., Industrial Air Compressor"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>

        {/* Tag Number */}
        <div className="space-y-2">
          <Label htmlFor="tagNo">
            Tag Number <span className="text-rose-500">*</span>
          </Label>
          <Input
            id="tagNo"
            placeholder="e.g., FAC-COMP-001"
            value={formData.tagNo}
            onChange={(e) => setFormData({ ...formData, tagNo: e.target.value })}
            required
          />
          <p className="text-xs text-slate-500">Unique identifier for tracking</p>
        </div>

        {/* Brand & Model */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="brand">Brand / Manufacturer</Label>
            <Input
              id="brand"
              placeholder="e.g., Atlas Copco"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="model">Model</Label>
            <Input
              id="model"
              placeholder="e.g., GA 160 VSD+"
              value={formData.model}
              onChange={(e) => setFormData({ ...formData, model: e.target.value })}
            />
          </div>
        </div>

        {/* Serial Number */}
        <div className="space-y-2">
          <Label htmlFor="serialNumber">Serial Number</Label>
          <Input
            id="serialNumber"
            placeholder="Serial number from manufacturer plate"
            value={formData.serialNumber}
            onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value })}
          />
        </div>

        {/* Purchase & Warranty Dates */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="purchaseDate">Purchase Date</Label>
            <Input
              id="purchaseDate"
              type="date"
              value={formData.purchaseDate}
              onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="warrantyEndDate">Warranty End Date</Label>
            <Input
              id="warrantyEndDate"
              type="date"
              value={formData.warrantyEndDate}
              onChange={(e) => setFormData({ ...formData, warrantyEndDate: e.target.value })}
            />
          </div>
        </div>

        {/* Location */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="e.g., Production Hall A"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Input
              id="department"
              placeholder="e.g., Manufacturing"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            />
          </div>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Brief description of the asset and its purpose..."
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>
      </div>

      <SheetFooter className="flex-col-reverse sm:flex-row gap-3 pt-4 border-t">
        <SheetClose asChild>
          <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">
            Cancel
          </Button>
        </SheetClose>
        <Button
          type="submit"
          className="w-full sm:w-auto bg-red-600 hover:bg-red-700"
          disabled={!formData.name || !formData.tagNo || !formData.type}
        >
          <Plus className="w-4 h-4 mr-2" />
          Register Asset
        </Button>
      </SheetFooter>
    </form>
  );
}
