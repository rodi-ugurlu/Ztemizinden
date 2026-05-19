import { useEffect, useState, useCallback } from 'react';
import { useCustomerStore, type AssetTreeNode } from '@/store/useCustomerStore';
import { useAuthStore } from '@/store/useAuthStore';
import AssetFormPanel, { type AssetFormData } from './components/AssetFormPanel';
import AssetTreeView from './components/AssetTreeView';
import { Layers, TreePine, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';

/**
 * AssetTreePage — Asset Breakdown Structure
 *
 * Premium split-screen page with:
 * - Left panel: Asset creation/editing form with dynamic sub-levels
 * - Right panel: Interactive hierarchical tree view
 * - Toast notifications for success/error feedback
 * - "Add child" from tree nodes
 */
export default function AssetTreePage() {
  const user = useAuthStore((s) => s.user);
  const {
    assetTree,
    fetchAssetTree,
    createAssetInTree,
    deleteAssetFromTree,
    isLoading,
  } = useCustomerStore();

  const [editingNode, setEditingNode] = useState<{ id: string; name: string } | null>(null);
  const [addingToParent, setAddingToParent] = useState<{ id: string; name: string } | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchAssetTree(user.id);
    }
  }, [fetchAssetTree, user?.id]);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // ── Stats ───────────────────────────────────────────────────────
  const countAll = (nodes: AssetTreeNode[]): number =>
    nodes.reduce((sum, n) => sum + 1 + countAll(n.children || []), 0);
  const totalNodes = countAll(assetTree);
  const leafCount = (() => {
    const count = (nodes: AssetTreeNode[]): number =>
      nodes.reduce((s, n) => s + (n.children?.length ? count(n.children) : 1), 0);
    return count(assetTree);
  })();

  // ── Form submission handler ─────────────────────────────────────
  const handleFormSubmit = useCallback(
    async (data: AssetFormData) => {
      if (!user?.id) return;
      setIsSaving(true);

      try {
        const allLevels = [
          { name: data.name, isRoot: true },
          ...data.subLevels.filter((s) => s.name.trim()),
        ];

        let currentParentId: string | undefined = addingToParent?.id ?? undefined;

        for (let i = 0; i < allLevels.length; i++) {
          const isLast = i === allLevels.length - 1;

          const newAsset = await createAssetInTree({
            ownerId: user.id,
            name: allLevels[i].name,
            tagNo: isLast && data.tagNo ? data.tagNo : `${data.name.substring(0, 3).toUpperCase()}-${Date.now()}-L${i}`,
            type: data.type,
            brand: data.brand,
            model: data.model,
            serialNumber: data.serialNumber,
            status: 'Active',
            location: data.location || undefined,
            description: isLast ? data.description : undefined,
            parentId: currentParentId,
          });

          if (!newAsset.id) {
            throw new Error('Varlık kaydı ID dönmedi, hiyerarşi oluşturma durduruldu');
          }

          currentParentId = newAsset.id;
        }

        await fetchAssetTree(user.id);
        setAddingToParent(null);
        setToast({ type: 'success', message: `"${data.name}" başarıyla oluşturuldu` });
      } catch (err) {
        console.error('Failed to create asset hierarchy:', err);
        setToast({ type: 'error', message: err instanceof Error ? err.message : 'Varlık oluşturulamadı' });
      } finally {
        setIsSaving(false);
      }
    },
    [user?.id, createAssetInTree, fetchAssetTree, addingToParent]
  );

  // ── Edit handler ────────────────────────────────────────────────
  const handleEdit = useCallback((node: AssetTreeNode) => {
    setEditingNode({ id: node.id, name: node.name });
    setAddingToParent(null);
    document.getElementById('asset-form-panel')?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // ── Add child handler ───────────────────────────────────────────
  const handleAddChild = useCallback((node: AssetTreeNode) => {
    setAddingToParent({ id: node.id, name: node.name });
    setEditingNode(null);
    document.getElementById('asset-form-panel')?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // ── Delete handler ──────────────────────────────────────────────
  const handleDelete = useCallback(
    async (node: AssetTreeNode) => {
      const childInfo = node.descendantCount > 0
        ? `\n\n⚠️ Bu varlığın ${node.descendantCount} alt varlığı da silinecek!`
        : '';

      if (!confirm(`"${node.name}" silinecek.${childInfo}\n\nEmin misiniz?`)) return;

      try {
        await deleteAssetFromTree(node.id);
        if (user?.id) await fetchAssetTree(user.id);
        setToast({ type: 'success', message: `"${node.name}" silindi` });
      } catch (err) {
        console.error('Failed to delete asset:', err);
        setToast({ type: 'error', message: 'Silme işlemi başarısız' });
      }
    },
    [deleteAssetFromTree, fetchAssetTree, user?.id]
  );

  return (
    <div className="flex flex-col h-[calc(100vh-73px)] relative">
      {/* ── Toast Notification ──────────────────────────────────── */}
      {toast && (
        <div
          className={`fixed top-20 right-6 z-[100] flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-2xl
                      border backdrop-blur-md transition-all duration-500 animate-in slide-in-from-right-5 fade-in
                      ${toast.type === 'success'
                        ? 'bg-emerald-50/95 border-emerald-200 text-emerald-800 shadow-emerald-100/50'
                        : 'bg-red-50/95 border-red-200 text-red-800 shadow-red-100/50'
                      }`}
        >
          {toast.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
          )}
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}

      {/* ── Page header bar ────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white px-6 py-5 flex-shrink-0">
        {/* Animated background pattern */}
        <div className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        {/* Glow effects */}
        <div className="absolute top-0 left-1/4 w-64 h-32 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-48 h-24 bg-blue-500/10 rounded-full blur-2xl" />

        <div className="relative max-w-screen-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 ring-2 ring-white/10">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight flex items-center gap-2.5">
                Varlık Ağacı
                <span className="text-sm font-medium text-indigo-300/80">— Asset Breakdown Structure</span>
              </h1>
              <p className="text-[11px] text-slate-400/80 mt-0.5 font-medium tracking-wide">
                Lokasyon → Alt Varlık → Alt Varlık → ... → Tag No
              </p>
            </div>
          </div>

          {/* Stats pills */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.07] border border-white/[0.08] backdrop-blur-sm">
              <TreePine className="w-3.5 h-3.5 text-indigo-400" />
              <span className="text-xs font-bold text-slate-300">{assetTree.length} kök</span>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.07] border border-white/[0.08] backdrop-blur-sm">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-bold text-slate-300">{totalNodes} varlık</span>
            </div>
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.07] border border-white/[0.08] backdrop-blur-sm">
              <span className="text-xs">📌</span>
              <span className="text-xs font-bold text-slate-300">{leafCount} yaprak</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── "Adding to parent" banner ──────────────────────────── */}
      {addingToParent && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center">
              <span className="text-xs">🔗</span>
            </div>
            <span className="text-sm text-blue-800">
              <span className="font-bold">"{addingToParent.name}"</span> altına yeni alt varlık ekleniyor
            </span>
          </div>
          <button
            onClick={() => setAddingToParent(null)}
            className="text-xs font-bold text-blue-600 hover:text-blue-800 px-3 py-1 rounded-lg hover:bg-blue-100 transition-colors"
          >
            İptal
          </button>
        </div>
      )}

      {/* ── Split layout ───────────────────────────────────────── */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left panel — Form */}
        <div
          id="asset-form-panel"
          className="w-full lg:w-[420px] xl:w-[460px] bg-white border-b lg:border-b-0 lg:border-r border-slate-200/80
                     flex flex-col overflow-hidden shrink-0 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.08)]"
        >
          <AssetFormPanel
            onSubmit={handleFormSubmit}
            editingNode={editingNode}
            onCancelEdit={() => setEditingNode(null)}
            isLoading={isSaving}
            parentContext={addingToParent}
          />
        </div>

        {/* Right panel — Tree */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0"
          style={{
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #eef2f7 100%)',
          }}
        >
          <AssetTreeView
            nodes={assetTree}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAddChild={handleAddChild}
          />
        </div>
      </div>
    </div>
  );
}
