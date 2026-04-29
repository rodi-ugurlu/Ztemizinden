import { useState, useRef } from 'react';
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
import { useCustomerStore, type TicketCategory, type TicketPriority } from '@/store/useCustomerStore';
import {
  ArrowLeft,
  Upload,
  X,
  ImageIcon,
  Video,
  AlertCircle,
  CheckCircle2,
  Wrench,
  Zap,
  Droplets,
  Settings,
  Info,
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

  const { assets, createTicket } = useCustomerStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

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
    { id: string; name: string; type: 'image' | 'video'; size: string }[]
  >([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedAsset = assets.find((a) => a.id === formData.assetId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.assetId || !formData.title || !formData.category) return;

    setIsSubmitting(true);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const newTicket = createTicket({
      assetId: formData.assetId,
      title: formData.title,
      description: formData.description,
      category: formData.category as TicketCategory,
      priority: formData.priority,
      mediaUrls: uploadedFiles.map((f) => `/uploads/${f.name}`),
      status: 'Open',
    });

    setIsSubmitting(false);
    setIsSuccess(true);
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return;

    const newFiles = Array.from(files).map((file) => ({
      id: Math.random().toString(36).substring(7),
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
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Service Request Submitted</h2>
            <p className="text-slate-600 mb-6">
              Your ticket has been created successfully. Our team will review it and contact you shortly.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="outline" onClick={() => navigate('/customer/dashboard')}>
                Back to Dashboard
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
                Create Another Ticket
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
          Back
        </Button>
      </div>

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Create Service Request</h1>
        <p className="text-slate-500 mt-1">Report an issue with your equipment or facility</p>
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
                <CardTitle>Select Asset</CardTitle>
                <CardDescription>Choose the equipment that needs service</CardDescription>
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
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Select an asset..." />
                </SelectTrigger>
                <SelectContent>
                  {assets.map((asset) => (
                    <SelectItem key={asset.id} value={asset.id}>
                      <div className="flex flex-col items-start">
                        <span className="font-medium">{asset.name}</span>
                        <span className="text-xs text-slate-500">{asset.tagNo} • {asset.brand}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedAsset && (
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Wrench className="w-5 h-5 text-red-600" />
                      <div>
                        <p className="font-medium text-slate-900">{selectedAsset.name}</p>
                        <p className="text-sm text-slate-500">
                          {selectedAsset.brand} {selectedAsset.model}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      {selectedAsset.location || selectedAsset.department}
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
                <CardTitle>Issue Details</CardTitle>
                <CardDescription>Describe the problem you're experiencing</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Category */}
            <div className="space-y-2">
              <Label>Issue Category <span className="text-rose-500">*</span></Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setFormData({ ...formData, category: cat.value })}
                    className={`p-4 rounded-lg border text-left transition-all ${
                      formData.category === cat.value
                        ? 'border-red-500 bg-red-50 ring-1 ring-red-500'
                        : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
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
                Issue Title <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="title"
                placeholder="e.g., Compressor overheating during startup"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="h-11"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Detailed Description</Label>
              <Textarea
                id="description"
                placeholder="Please provide as much detail as possible: when did the issue start? What are the symptoms? Any error messages or unusual sounds?"
                rows={5}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
              <p className="text-xs text-slate-500">
                Clear descriptions help our technicians diagnose and resolve issues faster
              </p>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label>Priority Level</Label>
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
                <CardTitle>Supporting Media</CardTitle>
                <CardDescription>Upload photos or videos (optional but recommended)</CardDescription>
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
                  ? 'border-red-500 bg-red-50'
                  : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
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
                <p className="text-slate-700 font-medium">Click or drag files to upload</p>
                <p className="text-sm text-slate-500 mt-1">Photos or videos of the issue</p>
                <p className="text-xs text-slate-400 mt-4">Supports: JPG, PNG, MP4 • Max 5 files • 50MB each</p>
              </div>
            </div>

            {/* Uploaded Files */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-slate-700">
                  Uploaded files ({uploadedFiles.length}/5)
                </p>
                <div className="space-y-2">
                  {uploadedFiles.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                    >
                      <div className="flex items-center gap-3">
                        {file.type === 'image' ? (
                          <ImageIcon className="w-5 h-5 text-red-500" />
                        ) : (
                          <Video className="w-5 h-5 text-purple-500" />
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
                        className="text-slate-400 hover:text-rose-500"
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
            Cancel
          </Button>
          <Button
            type="submit"
            className="bg-red-600 hover:bg-red-700 min-w-[200px]"
            disabled={isSubmitting || !formData.assetId || !formData.title || !formData.category}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Submit Service Request
              </>
            )}
          </Button>
        </div>
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
    label: 'Electric',
    description: 'Power, wiring, control panels',
    icon: Zap,
  },
  {
    value: 'Mechanic' as TicketCategory,
    label: 'Mechanic',
    description: 'Motors, belts, bearings',
    icon: Settings,
  },
  {
    value: 'Pneumatic' as TicketCategory,
    label: 'Pneumatic',
    description: 'Air systems, compressors',
    icon: Droplets,
  },
  {
    value: 'Hydraulic' as TicketCategory,
    label: 'Hydraulic',
    description: 'Hydraulic systems, pumps',
    icon: Droplets,
  },
  {
    value: 'Software' as TicketCategory,
    label: 'Software',
    description: 'Control systems, HMI, PLC',
    icon: Zap,
  },
  {
    value: 'General' as TicketCategory,
    label: 'General',
    description: 'Other maintenance needs',
    icon: Wrench,
  },
];

const priorities = [
  { value: 'Low' as TicketPriority, label: 'Low', selectedClass: 'bg-slate-200 text-slate-800 ring-slate-300' },
  { value: 'Medium' as TicketPriority, label: 'Medium', selectedClass: 'bg-red-100 text-blue-800 ring-blue-300' },
  { value: 'High' as TicketPriority, label: 'High', selectedClass: 'bg-amber-100 text-amber-800 ring-amber-300' },
  { value: 'Critical' as TicketPriority, label: 'Critical', selectedClass: 'bg-rose-100 text-rose-800 ring-rose-300' },
];

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
