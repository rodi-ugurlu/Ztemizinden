import { useEffect, useState, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useCustomerStore, type TicketCategory, type TicketPriority, type Asset } from '@/store/useCustomerStore';
import { useAuthStore } from '@/store/useAuthStore';
import { api, type UploadResponse } from '@/lib/api';
import {
  ArrowLeft,
  X,
  ImageIcon,
  Video,
  CheckCircle2,
  Wrench,
  Zap,
  Droplets,
  Settings,
  Camera,
  Loader2,
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

  const { assets, createTicket, fetchAssets } = useCustomerStore();
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
    }
  }, [fetchAssets, user?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.assetId || !formData.title || !formData.category) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const mediaUrls = await Promise.all(uploadedFiles.map(uploadTicketMedia));
      await createTicket({
        customerId: user?.id,
        customerName: user?.name,
        customerCompany: user?.name,
        customerLocation: selectedAsset?.location || 'Belirtilmedi',
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
              <Select
                value={formData.assetId}
                onValueChange={(v) => setFormData({ ...formData, assetId: v })}
                required
              >
                <SelectTrigger className="h-12 border-2 border-slate-200 focus:border-red-400 focus:ring-red-100 rounded-xl">
                  <SelectValue placeholder="Bir varlık seçin..." />
                </SelectTrigger>
                <SelectContent className="max-h-[350px]">
                  {assets.map((asset) => {
                    const isLocation = !asset.leaf || asset.depth === 0;
                    const path = getAssetPath(asset);
                    return (
                      <SelectItem key={asset.id} value={asset.id} className="py-2.5">
                        <div className="flex flex-col items-start text-left">
                          <span className="font-semibold flex items-center gap-1.5 text-slate-800 text-[14px]">
                            <span>{isLocation ? '📍' : '🔧'}</span>
                            <span>{asset.name}</span>
                            {isLocation && (
                              <span className="text-[9px] tracking-wide bg-indigo-50 text-indigo-700 border border-indigo-200/60 px-1.5 py-0.5 rounded-full font-bold">
                                Lokasyon
                              </span>
                            )}
                          </span>
                          <span className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-1.5">
                            {asset.parentId && <span className="font-medium text-slate-400">{path} •</span>}
                            <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1 py-0.2 rounded border border-slate-200/80">{asset.tagNo}</span>
                            {asset.brand && asset.brand !== 'N/A' && <span>• {asset.brand}</span>}
                          </span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>

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
