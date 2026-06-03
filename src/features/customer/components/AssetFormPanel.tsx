import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createClientUuid } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { AssetTreeNode, AssetType } from '@/store/useCustomerStore';
import {
  Plus,
  X,
  Save,
  RotateCcw,
  Factory,
  Building2,
  Home,
  Hash,
  Layers,
  Pencil,
  Loader2,
  GripVertical,
} from 'lucide-react';

// ── Depth level colors ────────────────────────────────────────────
const DEPTH_COLORS = [
  { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', ring: 'ring-indigo-300', accent: 'bg-indigo-500' },
  { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', ring: 'ring-blue-300', accent: 'bg-blue-500' },
  { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', ring: 'ring-cyan-300', accent: 'bg-cyan-500' },
  { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', ring: 'ring-violet-300', accent: 'bg-violet-500' },
  { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', ring: 'ring-rose-300', accent: 'bg-rose-500' },
  { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', ring: 'ring-emerald-300', accent: 'bg-emerald-500' },
  { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', ring: 'ring-amber-300', accent: 'bg-amber-500' },
  { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200', ring: 'ring-pink-300', accent: 'bg-pink-500' },
  { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', ring: 'ring-teal-300', accent: 'bg-teal-500' },
  { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200', ring: 'ring-orange-300', accent: 'bg-orange-500' },
];

function getDepthColor(depth: number) {
  return DEPTH_COLORS[depth % DEPTH_COLORS.length];
}

// ── Types ─────────────────────────────────────────────────────────

interface SubAssetLevel {
  id: string;
  name: string;
}

export interface AssetFormData {
  name: string;
  tagNo: string;
  type: AssetType;
  brand: string;
  model: string;
  serialNumber: string;
  location: string;
  description: string;
  subLevels: SubAssetLevel[];
  parentId?: string;
}

interface AssetFormPanelProps {
  onSubmit: (data: AssetFormData) => Promise<void> | void;
  editingNode?: AssetTreeNode | null;
  onCancelEdit?: () => void;
  isLoading?: boolean;
  parentContext?: { id: string; name: string } | null;
}

/**
 * Left panel form for creating/editing assets in the tree.
 * Premium design with dynamic sub-asset levels.
 */
export default function AssetFormPanel({
  onSubmit,
  editingNode,
  onCancelEdit,
  isLoading,
  parentContext,
}: AssetFormPanelProps) {
  const [name, setName] = useState(editingNode?.name ?? '');
  const [tagNo, setTagNo] = useState(editingNode?.tagNo ?? '');
  const [type, setType] = useState<AssetType | ''>(editingNode?.type ?? '');
  const [brand, setBrand] = useState(editingNode?.brand ?? '');
  const [model, setModel] = useState(editingNode?.model ?? '');
  const [serialNumber, setSerialNumber] = useState(editingNode?.serialNumber ?? '');
  const [location, setLocation] = useState(editingNode?.location ?? '');
  const [description, setDescription] = useState(editingNode?.description ?? '');
  const [subLevels, setSubLevels] = useState<SubAssetLevel[]>([]);
  const isEditMode = Boolean(editingNode);

  const addSubLevel = () => {
    setSubLevels((prev) => [...prev, { id: createClientUuid(), name: '' }]);
  };

  const removeSubLevel = (id: string) => {
    setSubLevels((prev) => prev.filter((s) => s.id !== id));
  };

  const updateSubLevel = (id: string, value: string) => {
    setSubLevels((prev) => prev.map((s) => (s.id === id ? { ...s, name: value } : s)));
  };

  const clearForm = () => {
    setName('');
    setTagNo('');
    setType('');
    setBrand('');
    setModel('');
    setSerialNumber('');
    setLocation('');
    setDescription('');
    setSubLevels([]);
    onCancelEdit?.();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !type) return;

    try {
      await onSubmit({
        name: name.trim(),
        tagNo: tagNo.trim(),
        type: type as AssetType,
        brand: brand.trim() || 'N/A',
        model: model.trim() || 'N/A',
        serialNumber: serialNumber.trim() || 'N/A',
        location: location.trim(),
        description: description.trim(),
        subLevels: isEditMode ? [] : subLevels.filter((s) => s.name.trim()),
      });

      clearForm();
    } catch {
      // Parent page owns the toast; keep the form data in place for correction.
    }
  };

  // Build preview path
  const previewPath = [
    parentContext?.name,
    name || null,
    ...(isEditMode ? [] : subLevels.map((s) => s.name || null).filter(Boolean)),
  ].filter(Boolean).join(' › ');

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-full">
      {/* Header */}
      <div className="p-5 border-b border-slate-100 bg-gradient-to-b from-white to-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-200/60">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <h2 className="font-bold text-slate-900 text-[17px]">
              {editingNode ? 'Varlık Düzenle' : 'Yeni Varlık'}
            </h2>
            <p className="text-[11px] text-slate-500 font-medium">
              {editingNode ? 'Mevcut varlığı güncelle' : 'Hiyerarşik varlık yapısı oluştur'}
            </p>
          </div>
        </div>

        {/* Live preview path */}
        {previewPath && (
          <div className="mt-3 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Yol Önizleme</p>
            <p className="text-xs font-semibold text-indigo-700 truncate">{previewPath}</p>
          </div>
        )}
      </div>

      {/* Editing indicator */}
      {editingNode && (
        <div className="mx-5 mt-4 p-3.5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl flex items-center gap-2.5 shadow-sm">
          <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
            <Pencil className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider">Düzenleniyor</span>
            <p className="text-sm font-semibold text-amber-700 truncate">{editingNode.name}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearForm}
            className="h-7 w-7 p-0 text-amber-600 hover:text-white hover:bg-amber-500 rounded-lg shrink-0 transition-all"
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      )}

      {/* Scrollable form body */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
        {/* Varlık Adı */}
        <div className="space-y-2">
          <Label className="text-[11px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
            Varlık Adı
            <span className="text-red-500 text-xs">*</span>
          </Label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Örn: Üretim Üst Kat, Ana Kompresör"
            className="h-12 text-[15px] font-semibold border-2 border-slate-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 rounded-xl transition-all"
            required
          />
        </div>

        {/* Asset Type */}
        <div className="space-y-2">
          <Label className="text-[11px] font-black text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            Varlık Tipi
            <span className="text-red-500 text-xs">*</span>
          </Label>
          <Select value={type} onValueChange={(v) => setType(v as AssetType)} required>
            <SelectTrigger className="h-12 border-2 border-slate-200 rounded-xl text-[15px]">
              <SelectValue placeholder="Tip seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Facility">
                <span className="flex items-center gap-2.5 py-0.5">
                  <div className="w-7 h-7 rounded-lg bg-indigo-100 flex items-center justify-center">
                    <Factory className="w-4 h-4 text-indigo-600" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800">Tesis</span>
                    <span className="text-xs text-slate-500 ml-1">— Endüstriyel</span>
                  </div>
                </span>
              </SelectItem>
              <SelectItem value="SME">
                <span className="flex items-center gap-2.5 py-0.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800">KOBİ</span>
                    <span className="text-xs text-slate-500 ml-1">— Küçük İşletme</span>
                  </div>
                </span>
              </SelectItem>
              <SelectItem value="Home">
                <span className="flex items-center gap-2.5 py-0.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 flex items-center justify-center">
                    <Home className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <span className="font-semibold text-slate-800">Ev</span>
                    <span className="text-xs text-slate-500 ml-1">— Konut</span>
                  </div>
                </span>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {!isEditMode && (
          <>
            {/* Divider — Sub Assets */}
            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t-2 border-dashed border-slate-200" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
                  Alt Varlıklar
                </span>
              </div>
            </div>

            {/* Sub-asset levels */}
            <div className="space-y-2.5">
              {subLevels.map((sub, index) => {
                const color = getDepthColor(index + 1);
                return (
                  <div
                    key={sub.id}
                    className={`flex items-center gap-2.5 p-2 rounded-xl border ${color.border} ${color.bg} transition-all duration-300`}
                    style={{ animation: 'slideDown 0.3s ease-out' }}
                  >
                    <div className="flex items-center gap-1.5 shrink-0">
                      <GripVertical className="w-3 h-3 text-slate-300" />
                      <div
                        className={`w-7 h-7 rounded-lg ${color.accent} text-white flex items-center justify-center text-[11px] font-black shadow-sm`}
                      >
                        {index + 1}
                      </div>
                    </div>
                    <Input
                      value={sub.name}
                      onChange={(e) => updateSubLevel(sub.id, e.target.value)}
                      placeholder={`Seviye ${index + 1} — Alt varlık adı`}
                      className={`flex-1 h-9 border-0 bg-white/80 focus:bg-white rounded-lg text-sm font-medium shadow-sm focus:ring-2 ${color.ring}`}
                      autoFocus
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSubLevel(sub.id)}
                      className="h-7 w-7 p-0 text-red-400 hover:text-white hover:bg-red-500 rounded-lg transition-all shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                );
              })}

              <button
                type="button"
                onClick={addSubLevel}
                className="w-full py-3.5 border-2 border-dashed border-indigo-200 rounded-xl bg-indigo-50/30
                           text-indigo-600 text-sm font-bold flex items-center justify-center gap-2
                           hover:bg-indigo-50 hover:border-indigo-300 hover:shadow-sm transition-all duration-200 group"
              >
                <Plus className="w-4 h-4 group-hover:scale-125 transition-transform duration-200" />
                Alt Varlık Katmanı Ekle
              </button>
            </div>
          </>
        )}

        {/* Divider — Details */}
        <div className="relative py-1">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t-2 border-dashed border-slate-200" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">
              Detaylar
            </span>
          </div>
        </div>

        {/* Tag No */}
        <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl space-y-2 shadow-sm">
          <Label className="text-[11px] font-black text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
            <Hash className="w-3.5 h-3.5" /> Tag No
          </Label>
          <Input
            value={tagNo}
            onChange={(e) => setTagNo(e.target.value)}
            placeholder="Örn: URT-REAKTOR-RT1-GOV-PT100"
            className="font-mono font-bold text-amber-900 bg-white/90 border-2 border-amber-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-100 rounded-xl h-11 text-sm"
          />
          <p className="text-[10px] text-amber-600/80 font-medium">
            Boş bırakılırsa otomatik oluşturulur
          </p>
        </div>

        {/* Brand & Model */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label className="text-[11px] font-bold text-slate-500">Marka</Label>
            <Input
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="Atlas Copco"
              className="h-10 border-2 border-slate-200 rounded-xl"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-[11px] font-bold text-slate-500">Model</Label>
            <Input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="GA 160 VSD+"
              className="h-10 border-2 border-slate-200 rounded-xl"
            />
          </div>
        </div>

        {/* Serial Number */}
        <div className="space-y-2">
          <Label className="text-[11px] font-bold text-slate-500">Seri Numarası</Label>
          <Input
            value={serialNumber}
            onChange={(e) => setSerialNumber(e.target.value)}
            placeholder="Plakadaki seri numarası"
            className="h-10 border-2 border-slate-200 rounded-xl font-mono text-sm"
          />
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label className="text-[11px] font-bold text-slate-500">Fiziksel Konum</Label>
          <Input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Örn: Bina A, 3. Kat"
            className="h-10 border-2 border-slate-200 rounded-xl"
          />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label className="text-[11px] font-bold text-slate-500">Açıklama</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Varlığın kısa açıklaması..."
            rows={2}
            className="border-2 border-slate-200 rounded-xl resize-none"
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className="p-5 border-t border-slate-100 space-y-2.5 bg-gradient-to-t from-slate-50/80 to-white">
        <Button
          type="submit"
          disabled={!name.trim() || !type || isLoading}
          className="w-full h-13 bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600 hover:from-emerald-600 hover:via-emerald-700 hover:to-teal-700
                     text-white font-bold text-[15px] rounded-2xl shadow-lg shadow-emerald-200/60 transition-all duration-300
                     disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed
                     hover:shadow-xl hover:shadow-emerald-200/80 hover:-translate-y-0.5 active:translate-y-0"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Kaydediliyor...
            </>
          ) : (
            <>
              <Save className="w-5 h-5 mr-2" />
              {editingNode ? 'Güncelle' : 'Kaydet'}
            </>
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={clearForm}
          className="w-full h-10 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl font-semibold"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Formu Temizle
        </Button>
      </div>
    </form>
  );
}
