import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomerStore, type Asset, type AssetTreeNode } from '@/store/useCustomerStore';
import { useAuthStore } from '@/store/useAuthStore';
import { createClientUuid } from '@/lib/utils';
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
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const {
    assetTree,
    fetchAssetTree,
    createAssetInTree,
    updateAssetInTree,
    deleteAssetFromTree,
  } = useCustomerStore();
  const userId = user?.id;

  const [editingNode, setEditingNode] = useState<AssetTreeNode | null>(null);
  const [addingToParent, setAddingToParent] = useState<{ id: string; name: string } | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchAssetTree(userId);
    }
  }, [fetchAssetTree, userId]);

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
      if (!userId) return;
      setIsSaving(true);

      try {
        if (editingNode) {
          if (!data.tagNo.trim()) {
            throw new Error('Tag no düzenleme sırasında boş bırakılamaz');
          }

          await updateAssetInTree(editingNode.id, {
            name: data.name,
            tagNo: data.tagNo,
            type: data.type,
            brand: data.brand,
            model: data.model,
            serialNumber: data.serialNumber,
            purchaseDate: editingNode.purchaseDate || undefined,
            warrantyEndDate: editingNode.warrantyEndDate || undefined,
            status: editingNode.status,
            location: data.location || undefined,
            department: editingNode.department || undefined,
            description: data.description || undefined,
          });

          await fetchAssetTree(userId);
          setEditingNode(null);
          setToast({ type: 'success', message: `"${data.name}" güncellendi` });
          return;
        }

        const levelNames = [
          data.name,
          ...data.subLevels.map((level) => level.name),
        ]
          .map((name) => name.trim())
          .filter(Boolean);

        if (!levelNames.length) {
          throw new Error('En az bir varlık adı girilmelidir');
        }

        const workingTree = cloneTree(assetTree);
        let currentParentId: string | null = addingToParent?.id ?? null;
        let createdCount = 0;
        let lastNodeName = levelNames[levelNames.length - 1];

        for (let index = 0; index < levelNames.length; index++) {
          const name = levelNames[index];
          const existingNode = findDirectChildByName(workingTree, currentParentId, name);
          const isLast = index === levelNames.length - 1;

          if (existingNode) {
            currentParentId = existingNode.id;
            lastNodeName = existingNode.name;
            continue;
          }

          const newAsset = await createAssetInTree({
            ownerId: userId,
            name,
            tagNo: isLast && data.tagNo
              ? data.tagNo
              : isLast
              ? generateLeafTag(levelNames)
              : generateBranchTag(levelNames, index),
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

          appendNodeToWorkingTree(workingTree, currentParentId, assetToTreeNode(newAsset, currentParentId));
          currentParentId = newAsset.id;
          lastNodeName = newAsset.name;
          createdCount++;
        }

        await fetchAssetTree(userId);
        setAddingToParent(null);
        setToast({
          type: 'success',
          message: createdCount > 0
            ? `"${lastNodeName}" oluşturuldu; ortak kırılımlar mevcut dallarla birleştirildi`
            : 'Bu kırılım zaten mevcut; tekrar oluşturulmadı',
        });
      } catch (err) {
        console.error('Failed to create asset hierarchy:', err);
        setToast({ type: 'error', message: err instanceof Error ? err.message : 'Varlık oluşturulamadı' });
        throw err;
      } finally {
        setIsSaving(false);
      }
    },
    [userId, editingNode, assetTree, createAssetInTree, updateAssetInTree, fetchAssetTree, addingToParent]
  );

  // ── Edit handler ────────────────────────────────────────────────
  const handleEdit = useCallback((node: AssetTreeNode) => {
    setEditingNode(node);
    setAddingToParent(null);
    document.getElementById('asset-form-panel')?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // ── Add child handler ───────────────────────────────────────────
  const handleAddChild = useCallback((node: AssetTreeNode) => {
    setAddingToParent({ id: node.id, name: node.name });
    setEditingNode(null);
    document.getElementById('asset-form-panel')?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  // ── Create ticket from selected asset ──────────────────────────
  const handleCreateTicket = useCallback((node: AssetTreeNode) => {
    const params = new URLSearchParams({ assetId: node.id });
    navigate(`/customer/tickets/create?${params.toString()}`);
  }, [navigate]);

  // ── Delete handler ──────────────────────────────────────────────
  const handleDelete = useCallback(
    async (node: AssetTreeNode) => {
      const childInfo = node.descendantCount > 0
        ? `\n\nDikkat: Bu varlığın ${node.descendantCount} alt varlığı da silinecek.`
        : '';

      if (!confirm(`"${node.name}" silinecek.${childInfo}\n\nEmin misiniz?`)) return;

      try {
        await deleteAssetFromTree(node.id);
        if (userId) await fetchAssetTree(userId);
        setToast({ type: 'success', message: `"${node.name}" silindi` });
      } catch (err) {
        console.error('Failed to delete asset:', err);
        setToast({ type: 'error', message: 'Silme işlemi başarısız' });
      }
    },
    [deleteAssetFromTree, fetchAssetTree, userId]
  );

  return (
    <div className="relative flex min-h-[calc(100svh-73px)] flex-col lg:h-[calc(100vh-73px)]">
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
      <div className="flex-1 flex flex-col lg:flex-row overflow-visible lg:overflow-hidden">
        {/* Left panel — Form */}
        <div
          id="asset-form-panel"
          className="w-full lg:w-[420px] xl:w-[460px] bg-white border-b lg:border-b-0 lg:border-r border-slate-200/80
                     flex flex-col lg:overflow-hidden shrink-0 shadow-[4px_0_24px_-12px_rgba(0,0,0,0.08)]"
        >
          <AssetFormPanel
            key={editingNode?.id ?? addingToParent?.id ?? 'new-root-asset'}
            onSubmit={handleFormSubmit}
            editingNode={editingNode}
            onCancelEdit={() => setEditingNode(null)}
            isLoading={isSaving}
            parentContext={addingToParent}
          />
        </div>

        {/* Right panel — Tree */}
        <div className="flex min-h-[520px] flex-1 flex-col overflow-hidden lg:min-h-0"
          style={{
            background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #eef2f7 100%)',
          }}
        >
          <AssetTreeView
            nodes={assetTree}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAddChild={handleAddChild}
            onCreateTicket={handleCreateTicket}
          />
        </div>
      </div>
    </div>
  );
}

function cloneTree(nodes: AssetTreeNode[]): AssetTreeNode[] {
  return nodes.map((node) => ({
    ...node,
    children: cloneTree(node.children ?? []),
  }));
}

function findDirectChildByName(nodes: AssetTreeNode[], parentId: string | null, name: string): AssetTreeNode | null {
  const siblings = parentId ? findNodeById(nodes, parentId)?.children ?? [] : nodes;
  const normalizedName = normalizeAssetName(name);
  return siblings.find((node) => normalizeAssetName(node.name) === normalizedName) ?? null;
}

function findNodeById(nodes: AssetTreeNode[], id: string): AssetTreeNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    const childMatch = findNodeById(node.children ?? [], id);
    if (childMatch) return childMatch;
  }
  return null;
}

function appendNodeToWorkingTree(nodes: AssetTreeNode[], parentId: string | null, node: AssetTreeNode) {
  if (!parentId) {
    nodes.push(node);
    return;
  }

  const parent = findNodeById(nodes, parentId);
  if (!parent) return;
  parent.children = [...(parent.children ?? []), node];
  parent.leaf = false;
  parent.childCount = parent.children.length;
  parent.descendantCount += 1 + node.descendantCount;
}

function assetToTreeNode(asset: Asset, parentId: string | null): AssetTreeNode {
  return {
    ...asset,
    parentId,
    children: [],
    childCount: 0,
    descendantCount: 0,
  };
}

function normalizeAssetName(value: string) {
  return value.trim().replace(/\s+/g, ' ').toLocaleLowerCase('tr-TR');
}

function generateBranchTag(levelNames: string[], index: number) {
  return `${tagPath(levelNames.slice(0, index + 1))}-AUTO-L${index}-${uniqueTagSuffix()}`;
}

function generateLeafTag(levelNames: string[]) {
  return `${tagPath(levelNames)}-${uniqueTagSuffix()}`;
}

function tagPath(levelNames: string[]) {
  const path = levelNames.map(tagSegment).filter(Boolean).join('-');
  return path || 'ASSET';
}

function tagSegment(value: string) {
  return value
    .trim()
    .toLocaleUpperCase('tr-TR')
    .replace(/İ/g, 'I')
    .replace(/Ğ/g, 'G')
    .replace(/Ü/g, 'U')
    .replace(/Ş/g, 'S')
    .replace(/Ö/g, 'O')
    .replace(/Ç/g, 'C')
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 18);
}

function uniqueTagSuffix() {
  return `${Date.now().toString(36)}-${createClientUuid().slice(0, 8)}`.toUpperCase();
}
