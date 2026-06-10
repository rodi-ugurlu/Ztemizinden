import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useCustomerStore, type TicketCategory, type TicketPriority, type Asset } from '@/store/useCustomerStore';
import { useAuthStore } from '@/store/useAuthStore';
import { api, type UploadResponse } from '@/lib/api';
import { formatLocation } from '@/lib/locations';
import {
  ArrowLeft,
  X,
  ImageIcon,
  Video,
  CheckCircle2,
  Check,
  ChevronsUpDown,
  Wrench,
  Zap,
  Droplets,
  Settings,
  Camera,
  Loader2,
  Search,
  Package,
  Hash,
  MapPin,
} from 'lucide-react';

/**
 * CreateTicketPage Component
 *
 * Service request creation form for Customer Portal.
 * Allows customers to report issues with their assets and upload supporting media.
 */
export default function CreateTicketPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedAssetId = searchParams.get('assetId');

  const { assets, customerProfile, createTicket, fetchAssets, fetchCustomerProfile } = useCustomerStore();
  const user = useAuthStore((state) => state.user);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    assetId: preselectedAssetId || '',
    title: '',
    description: '',
    category: '' as TicketCategory | '',
    priority: 'Medium' as TicketPriority,
  });

  // Media upload state
  const [uploadedFiles, setUploadedFiles] = useState<
    { id: string; file: File; name: string; type: 'image' | 'video'; size: string }[]
  >([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedAsset = assets.find((a) => a.id === formData.assetId);

  const getAssetPath = (asset: Asset | undefined) => {
    if (!asset) return '';
    const parts = [];
    let current: Asset | undefined = asset;
    while (current) {
      parts.unshift(current.name);
      const pId: string | null | undefined = current.parentId;
      current = pId
        ? assets.find((a) => a.id === pId)
        : undefined;
    }
    return parts.join(' › ');
  };

  useEffect(() => {
    if (user?.id) {
      fetchAssets(user.id);
      fetchCustomerProfile();
    }
  }, [fetchAssets, fetchCustomerProfile, user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.assetId || !formData.title || !formData.category) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const mediaUrls = await Promise.all(uploadedFiles.map(uploadTicketMedia));
      const ticketAddress = selectedAsset?.location || customerProfile?.address || '';
      const ticketCity = customerProfile?.city || '';
      const ticketDistrict = customerProfile?.district || '';
      await createTicket({
        customerId: user?.id,
        customerName: customerProfile?.contactName || user?.name,
        customerCompany: customerProfile?.companyName || user?.name,
        customerLocation: formatLocation(ticketCity, ticketDistrict, ticketAddress) || 'Belirtilmedi',
        customerCity: ticketCity,
        customerDistrict: ticketDistrict,
        customerAddress: ticketAddress,
        assetId: formData.assetId,
        title: formData.title,
        description: formData.description || formData.title,
        category: formData.category as TicketCategory,
        priority: formData.priority,
        mediaUrls,
      });

      setIsSuccess(true);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Talep olusturulamadi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newFiles = Array.from(files).map((file) => ({
      id: Math.random().toString(36).substring(7),
      file,
      name: file.name,
      type: file.type.startsWith('image/')
        ? ('image' as const)
        : file.type.startsWith('video/')
        ? ('video' as const)
        : ('image' as const),
      size: formatFileSize(file.size),
    }));

    setUploadedFiles((prev) => [...prev, ...newFiles].slice(0, 5));
  };

  const removeFile = (id: string) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  if (isSuccess) {
    return (
      <div className="p-6 lg:p-8 max-w-2xl mx-auto">
        <Card className="text-center py-12">
          <CardContent>
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10 text-emerald-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Servis Talebi Oluşturuldu</h2>
            <p className="text-slate-600 mb-6">
              Talebiniz başarıyla kaydedildi. Ekibimiz inceleyip en kısa sürede sizinle iletişime geçecek.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate('/customer/dashboard')}>
                Panele Dön
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700"
                onClick={() => {
                  setIsSuccess(false);
                  setFormData({
                    assetId: '',
                    title: '',
                    description: '',
                    category: '',
                    priority: 'Medium',
                  });
                  setUploadedFiles([]);
                }}
              >
                Yeni Talep Oluştur
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="text-slate-600">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Geri
        </Button>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Arıza Kaydı Oluştur</h1>
        <p className="text-slate-500 mt-1">Ekipman veya tesisinizle ilgili bir sorun bildirin</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Select Asset */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 font-bold text-sm">1</span>
              </div>
              <div>
                <CardTitle>Varlık Seçin</CardTitle>
                <CardDescription>Servis gerektiren ekipmanı seçin</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <AssetSearchPicker
                assets={assets}
                selectedAssetId={formData.assetId}
                getAssetPath={getAssetPath}
                onSelect={(assetId) => setFormData({ ...formData, assetId })}
              />

              {selectedAsset && (
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 shadow-sm transition-all duration-300">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-white border border-slate-200 rounded-2xl flex items-center justify-center shrink-0 shadow-sm text-xl">
                        {(!selectedAsset.leaf || selectedAsset.depth === 0) ? '📍' : '🔧'}
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-slate-900">{selectedAsset.name}</h4>
                          {(!selectedAsset.leaf || selectedAsset.depth === 0) && (
                            <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full font-bold">
                              Lokasyon / Konteyner
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 font-medium leading-relaxed">
                          Yol: <span className="text-indigo-700 font-semibold">{getAssetPath(selectedAsset)}</span>
                        </p>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-slate-500 pt-0.5">
                          <span className="font-mono">Tag: {selectedAsset.tagNo}</span>
                          {selectedAsset.brand && selectedAsset.brand !== 'N/A' && (
                            <span>• Marka/Model: {selectedAsset.brand} {selectedAsset.model}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-slate-200/80 text-slate-700 px-3.5 py-1.5 rounded-xl font-bold self-start sm:self-center">
                      {selectedAsset.location || selectedAsset.department || 'Merkez'}
                    </Badge>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Step 2: Issue Details */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 font-bold text-sm">2</span>
              </div>
              <div>
                <CardTitle>Arıza Detayları</CardTitle>
                <CardDescription>Yaşadığınız sorunu açıklayın</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Category */}
            <div className="space-y-2">
              <Label>Arıza Kategorisi <span className="text-red-600">*</span></Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: cat.value })}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      formData.category === cat.value
                        ? 'border-red-200 bg-red-50 ring-1 ring-red-500'
                        : 'border-slate-200 hover:border-red-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <cat.icon
                        className={`w-5 h-5 ${
                          formData.category === cat.value ? 'text-red-600' : 'text-slate-400'
                        }`}
                      />
                      <span
                        className={`font-medium ${
                          formData.category === cat.value ? 'text-red-900' : 'text-slate-700'
                        }`}
                      >
                        {cat.label}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500">{cat.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Arıza Başlığı <span className="text-red-600">*</span>
              </Label>
              <Input
                id="title"
                placeholder="Örn: Kompresör çalıştırmada aşırı ısınma"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="h-11"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Detaylı Açıklama</Label>
              <Textarea
                id="description"
                placeholder="Lütfen mümkün olduğunca fazla detay verin: Sorun ne zaman başladı? Belirtiler neler? Herhangi bir hata kodu veya olağandışı ses var mı?"
                rows={5}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              <p className="text-xs text-slate-500">
                Net açıklamalar, teknisyenlerimizin sorunu daha hızlı teşhis edip çözmesini sağlar
              </p>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label>Öncelik Seviyesi</Label>
              <div className="flex flex-wrap gap-3">
                {priorities.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, priority: p.value })}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      formData.priority === p.value
                        ? `ring-2 ring-offset-1 ${p.selectedClass}`
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Step 3: Media Upload */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-600 font-bold text-sm">3</span>
              </div>
              <div>
                <CardTitle>Destek Medyası</CardTitle>
                <CardDescription>Fotoğraf veya video yükleyin (isteğe bağlı ancak önerilir)</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Drop Zone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-red-200 bg-red-50'
                  : 'border-slate-300 hover:border-red-400 hover:bg-slate-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
              />
              <div className="flex flex-col items-center">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mb-4">
                  <Camera className="w-8 h-8 text-red-600" />
                </div>
                <p className="text-slate-700 font-medium">Dosya yüklemek için tıklayın veya sürükleyin</p>
                <p className="text-sm text-slate-500 mt-1">Arızanın fotoğrafları veya videosu</p>
                <p className="text-xs text-slate-400 mt-4">Desteklenen: JPG, PNG, MP4 • Maks. 5 dosya • Her biri 50MB</p>
              </div>
            </div>

            {/* Uploaded Files */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-700">
                  Yüklenen dosyalar ({uploadedFiles.length}/5)
                </p>
                <div className="space-y-2">
                  {uploadedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                    >
                      <div className="flex items-center gap-3">
                        {file.type === 'image' ? (
                          <ImageIcon className="w-5 h-5 text-red-600" />
                        ) : (
                          <Video className="w-5 h-5 text-red-600" />
                        )}
                        <div>
                          <p className="text-sm font-medium text-slate-700 truncate max-w-[200px]">
                            {file.name}
                          </p>
                          <p className="text-xs text-slate-500">{file.size}</p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(file.id)}
                        className="text-slate-400 hover:text-red-600"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex flex-col sm:flex-row gap-4 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/customer/dashboard')}
            disabled={isSubmitting}
          >
            İptal
          </Button>
          <Button
            type="submit"
            className="bg-red-600 hover:bg-red-700 min-w-[200px]"
            disabled={isSubmitting || !formData.assetId || !formData.title || !formData.category}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Gönderiliyor...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Talebi Gönder
              </>
            )}
          </Button>
        </div>
        {submitError && <p className="text-sm text-red-600 text-right">{submitError}</p>}
      </form>
    </div>
  );
}

// ==========================================
// CONSTANTS & HELPERS
// ==========================================

const categories = [
  {
    value: 'Electric' as TicketCategory,
    label: 'Elektrik',
    description: 'Güç, kablolama, kontrol panoları',
    icon: Zap,
  },
  {
    value: 'Mechanic' as TicketCategory,
    label: 'Mekanik',
    description: 'Motorlar, kayışlar, rulmanlar',
    icon: Settings,
  },
  {
    value: 'Pneumatic' as TicketCategory,
    label: 'Pnömatik',
    description: 'Hava sistemleri, kompresörler',
    icon: Droplets,
  },
  {
    value: 'Hydraulic' as TicketCategory,
    label: 'Hidrolik',
    description: 'Hidrolik sistemler, pompalar',
    icon: Droplets,
  },
  {
    value: 'Software' as TicketCategory,
    label: 'Yazılım',
    description: 'Kontrol sistemleri, HMI, PLC',
    icon: Zap,
  },
  {
    value: 'General' as TicketCategory,
    label: 'Genel',
    description: 'Diğer bakım ihtiyaçları',
    icon: Wrench,
  },
];

const priorities = [
  { value: 'Low' as TicketPriority, label: 'Düşük', selectedClass: 'bg-slate-200 text-slate-800 ring-slate-300' },
  { value: 'Medium' as TicketPriority, label: 'Orta', selectedClass: 'bg-amber-100 text-amber-800 ring-amber-300' },
  { value: 'High' as TicketPriority, label: 'Yüksek', selectedClass: 'bg-orange-100 text-orange-800 ring-orange-300' },
  { value: 'Critical' as TicketPriority, label: 'Kritik', selectedClass: 'bg-red-100 text-red-800 ring-red-300' },
];

interface AssetSearchPickerProps {
  assets: Asset[];
  selectedAssetId: string;
  getAssetPath: (asset: Asset) => string;
  onSelect: (assetId: string) => void;
}

function AssetSearchPicker({ assets, selectedAssetId, getAssetPath, onSelect }: AssetSearchPickerProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedAsset = assets.find((asset) => asset.id === selectedAssetId);
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  const results = useMemo(() => {
    return rankAssets(assets, query, getAssetPath).slice(0, query.trim() ? 10 : 8);
  }, [assets, getAssetPath, query]);

  const inputValue = isOpen || !selectedAsset ? query : selectedAsset.name;
  const activeIndex = Math.min(highlightedIndex, Math.max(results.length - 1, 0));

  const chooseAsset = (asset: Asset) => {
    onSelect(asset.id);
    setQuery(asset.name);
    setIsOpen(false);
  };

  const clearSelection = () => {
    onSelect('');
    setQuery('');
    setHighlightedIndex(0);
    setIsOpen(true);
    inputRef.current?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setIsOpen(true);
      setHighlightedIndex((index) => Math.min(index + 1, Math.max(results.length - 1, 0)));
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setIsOpen(true);
      setHighlightedIndex((index) => Math.max(index - 1, 0));
      return;
    }

    if (event.key === 'Enter' && isOpen && results[activeIndex]) {
      event.preventDefault();
      chooseAsset(results[activeIndex].asset);
      return;
    }

    if (event.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div
        className={`relative rounded-2xl border-2 bg-white transition-all ${
          isOpen
            ? 'border-red-300 ring-4 ring-red-50'
            : selectedAsset
            ? 'border-emerald-200'
            : 'border-slate-200'
        }`}
      >
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          ref={inputRef}
          role="combobox"
          aria-expanded={isOpen}
          aria-controls="asset-search-results"
          value={inputValue}
          disabled={assets.length === 0}
          onFocus={() => {
            setQuery(selectedAsset ? selectedAsset.name : query);
            setHighlightedIndex(0);
            setIsOpen(true);
            window.setTimeout(() => inputRef.current?.select(), 0);
          }}
          onChange={(event) => {
            const nextQuery = event.target.value;
            setQuery(nextQuery);
            setHighlightedIndex(0);
            if (selectedAsset && nextQuery !== selectedAsset.name) {
              onSelect('');
            }
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={assets.length === 0 ? 'Önce varlık ekleyin' : 'Varlık adı, yol, tag no veya lokasyon yazın...'}
          className="h-[52px] border-0 bg-transparent pl-11 pr-20 text-[15px] font-semibold text-slate-900 shadow-none focus-visible:ring-0 disabled:cursor-not-allowed"
        />
        <div className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center gap-1">
          {selectedAsset && (
            <Button
            type="button"
            variant="ghost"
            size="sm"
            onMouseDown={(event) => event.preventDefault()}
            onClick={clearSelection}
            className="h-8 w-8 rounded-lg p-0 text-slate-400 hover:bg-red-50 hover:text-red-600"
            aria-label="Seçimi temizle"
          >
              <X className="h-4 w-4" />
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              setIsOpen(!isOpen);
              if (!isOpen) {
                inputRef.current?.focus();
              }
            }}
            className="h-8 w-8 rounded-lg p-0 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
            aria-label="Varlık listesini aç"
          >
            <ChevronsUpDown className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {isOpen && (
        <div
          id="asset-search-results"
          className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-40 max-h-[360px] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-900/10"
        >
          {results.length > 0 ? (
            <div className="space-y-1">
              {results.map(({ asset, path, matchedFields }, index) => {
                const isHighlighted = index === activeIndex;
                const isSelected = asset.id === selectedAssetId;
                const isLocation = !asset.leaf || asset.depth === 0;

                return (
                  <button
                    key={asset.id}
                    type="button"
                    onMouseEnter={() => setHighlightedIndex(index)}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => chooseAsset(asset)}
                    className={`w-full rounded-xl border px-3 py-3 text-left transition-all ${
                      isHighlighted
                        ? 'border-red-200 bg-red-50'
                        : 'border-transparent hover:border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                          isLocation ? 'bg-indigo-50 text-indigo-600' : 'bg-red-50 text-red-600'
                        }`}
                      >
                        {isLocation ? <MapPin className="h-4 w-4" /> : <Package className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <span className="truncate text-sm font-black text-slate-900">{asset.name}</span>
                          {isLocation && (
                            <span className="rounded-full border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-bold text-indigo-700">
                              Lokasyon
                            </span>
                          )}
                          {isSelected && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                              <Check className="h-3 w-3" />
                              Seçili
                            </span>
                          )}
                        </div>
                        <p className="mt-1 truncate text-xs font-medium text-slate-500">{path}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-[10px] font-bold text-slate-600">
                            <Hash className="h-3 w-3 text-slate-400" />
                            {asset.tagNo}
                          </span>
                          {asset.brand && asset.brand !== 'N/A' && (
                            <span className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">
                              {asset.brand} {asset.model && asset.model !== 'N/A' ? asset.model : ''}
                            </span>
                          )}
                          {asset.location && (
                            <span className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">
                              {asset.location}
                            </span>
                          )}
                          {matchedFields.length > 0 && (
                            <span className="rounded-lg bg-red-100 px-2 py-1 text-[10px] font-bold text-red-700">
                              {matchedFields.join(', ')}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center px-6 py-10 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                <Search className="h-5 w-5" />
              </div>
              <p className="text-sm font-bold text-slate-700">Eşleşen varlık bulunamadı</p>
              <p className="mt-1 max-w-xs text-xs leading-5 text-slate-500">
                Farklı bir ekipman adı, tag no veya hiyerarşi kelimesi deneyin.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function rankAssets(assets: Asset[], query: string, getAssetPath: (asset: Asset) => string) {
  const terms = tokenizeSearch(query);

  return assets
    .map((asset) => {
      const path = getAssetPath(asset);
      const haystack = normalizeSearchText([
        asset.name,
        path,
        asset.tagNo,
        asset.brand,
        asset.model,
        asset.serialNumber,
        asset.location,
        asset.department,
        asset.description,
      ].filter(Boolean).join(' '));
      const matchesAllTerms = terms.every((term) => haystack.includes(term));

      return {
        asset,
        path,
        matchedFields: terms.length ? matchedAssetFields(asset, path, terms) : [],
        score: terms.length ? scoreAsset(asset, path, terms) : defaultAssetScore(asset),
        matches: terms.length === 0 || matchesAllTerms,
      };
    })
    .filter((item) => item.matches)
    .sort((first, second) => second.score - first.score || first.asset.depth - second.asset.depth || first.asset.name.localeCompare(second.asset.name, 'tr-TR'));
}

function scoreAsset(asset: Asset, path: string, terms: string[]) {
  const name = normalizeSearchText(asset.name);
  const tagNo = normalizeSearchText(asset.tagNo);
  const normalizedPath = normalizeSearchText(path);
  const brandModel = normalizeSearchText([asset.brand, asset.model, asset.serialNumber].filter(Boolean).join(' '));
  const location = normalizeSearchText([asset.location, asset.department].filter(Boolean).join(' '));

  return terms.reduce((score, term) => {
    let nextScore = score;
    if (name.startsWith(term)) nextScore += 70;
    else if (name.includes(term)) nextScore += 48;
    if (tagNo.startsWith(term)) nextScore += 56;
    else if (tagNo.includes(term)) nextScore += 42;
    if (normalizedPath.includes(term)) nextScore += 28;
    if (location.includes(term)) nextScore += 18;
    if (brandModel.includes(term)) nextScore += 12;
    return nextScore;
  }, asset.leaf ? 8 : 2) - asset.depth;
}

function defaultAssetScore(asset: Asset) {
  return (asset.leaf ? 10 : 4) - asset.depth;
}

function matchedAssetFields(asset: Asset, path: string, terms: string[]) {
  const fields = [
    { label: 'isim', value: asset.name },
    { label: 'yol', value: path },
    { label: 'tag', value: asset.tagNo },
    { label: 'lokasyon', value: [asset.location, asset.department].filter(Boolean).join(' ') },
    { label: 'marka/model', value: [asset.brand, asset.model, asset.serialNumber].filter(Boolean).join(' ') },
  ];

  return fields
    .filter((field) => {
      const normalized = normalizeSearchText(field.value);
      return terms.some((term) => normalized.includes(term));
    })
    .map((field) => field.label)
    .slice(0, 3);
}

function tokenizeSearch(value: string) {
  return normalizeSearchText(value)
    .split(/[^a-z0-9]+/)
    .map((term) => term.trim())
    .filter(Boolean);
}

function normalizeSearchText(value: string | undefined) {
  return (value ?? '')
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

async function uploadTicketMedia(item: { file: File }) {
  const formData = new FormData();
  formData.append('file', item.file);
  const response = await api.upload<UploadResponse>('/uploads/ticket-media', formData);
  return response.url;
}
