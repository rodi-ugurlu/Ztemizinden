import { useState, useCallback } from 'react';
import type { AssetTreeNode } from '@/store/useCustomerStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ChevronRight,
  Pencil,
  Trash2,
  Search,
  TreePine,
  Factory,
  Building2,
  Home,
  Layers,
  Hash,
  PlusCircle,
  ChevronDown,
} from 'lucide-react';

// ── Depth Colors ──────────────────────────────────────────────────
const DEPTH_STYLES = [
  { accent: 'border-l-indigo-500', bg: 'hover:bg-indigo-50/70', label: 'text-indigo-900', badge: 'bg-indigo-100 text-indigo-700', dot: 'bg-indigo-500', line: 'border-indigo-200' },
  { accent: 'border-l-blue-500', bg: 'hover:bg-blue-50/70', label: 'text-blue-900', badge: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500', line: 'border-blue-200' },
  { accent: 'border-l-cyan-500', bg: 'hover:bg-cyan-50/70', label: 'text-cyan-900', badge: 'bg-cyan-100 text-cyan-700', dot: 'bg-cyan-500', line: 'border-cyan-200' },
  { accent: 'border-l-violet-500', bg: 'hover:bg-violet-50/70', label: 'text-violet-900', badge: 'bg-violet-100 text-violet-700', dot: 'bg-violet-500', line: 'border-violet-200' },
  { accent: 'border-l-rose-500', bg: 'hover:bg-rose-50/70', label: 'text-rose-900', badge: 'bg-rose-100 text-rose-700', dot: 'bg-rose-500', line: 'border-rose-200' },
  { accent: 'border-l-emerald-500', bg: 'hover:bg-emerald-50/70', label: 'text-emerald-900', badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500', line: 'border-emerald-200' },
  { accent: 'border-l-amber-500', bg: 'hover:bg-amber-50/70', label: 'text-amber-900', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500', line: 'border-amber-200' },
  { accent: 'border-l-pink-500', bg: 'hover:bg-pink-50/70', label: 'text-pink-900', badge: 'bg-pink-100 text-pink-700', dot: 'bg-pink-500', line: 'border-pink-200' },
  { accent: 'border-l-teal-500', bg: 'hover:bg-teal-50/70', label: 'text-teal-900', badge: 'bg-teal-100 text-teal-700', dot: 'bg-teal-500', line: 'border-teal-200' },
  { accent: 'border-l-orange-500', bg: 'hover:bg-orange-50/70', label: 'text-orange-900', badge: 'bg-orange-100 text-orange-700', dot: 'bg-orange-500', line: 'border-orange-200' },
];

function getDepthStyle(depth: number) {
  return DEPTH_STYLES[depth % DEPTH_STYLES.length];
}

function getTypeIcon(type: string) {
  switch (type) {
    case 'Facility': return <Factory className="w-4 h-4" />;
    case 'SME': return <Building2 className="w-4 h-4" />;
    case 'Home': return <Home className="w-4 h-4" />;
    default: return <Layers className="w-4 h-4" />;
  }
}

function getTypeColor(type: string) {
  switch (type) {
    case 'Facility': return 'text-indigo-500 bg-indigo-50';
    case 'SME': return 'text-blue-500 bg-blue-50';
    case 'Home': return 'text-emerald-500 bg-emerald-50';
    default: return 'text-slate-400 bg-slate-50';
  }
}

// ── Props ─────────────────────────────────────────────────────────

interface AssetTreeViewProps {
  nodes: AssetTreeNode[];
  onEdit: (node: AssetTreeNode) => void;
  onDelete: (node: AssetTreeNode) => void;
  onAddChild?: (node: AssetTreeNode) => void;
}

/**
 * Premium interactive tree component with animated accordion nodes.
 * Each depth level has a distinct color scheme.
 */
export default function AssetTreeView({ nodes, onEdit, onDelete, onAddChild }: AssetTreeViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleNode = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const expandAll = useCallback(() => {
    const allIds = new Set<string>();
    const collectIds = (nodes: AssetTreeNode[]) => {
      for (const node of nodes) {
        if (node.children?.length) {
          allIds.add(node.id);
          collectIds(node.children);
        }
      }
    };
    collectIds(nodes);
    setExpandedIds(allIds);
  }, [nodes]);

  const collapseAll = useCallback(() => {
    setExpandedIds(new Set());
  }, []);

  // Filter nodes recursively
  const filterNodes = useCallback((nodes: AssetTreeNode[], query: string): AssetTreeNode[] => {
    if (!query.trim()) return nodes;
    const lq = query.toLowerCase();
    return nodes
      .map((node) => {
        const childMatches = filterNodes(node.children || [], query);
        const selfMatches =
          node.name.toLowerCase().includes(lq) ||
          node.tagNo?.toLowerCase().includes(lq) ||
          node.brand?.toLowerCase().includes(lq);

        if (selfMatches || childMatches.length > 0) {
          return { ...node, children: childMatches.length > 0 ? childMatches : node.children || [] };
        }
        return null;
      })
      .filter(Boolean) as AssetTreeNode[];
  }, []);

  const filteredNodes = filterNodes(nodes, searchQuery);

  const countTotal = (nodes: AssetTreeNode[]): number =>
    nodes.reduce((sum, n) => sum + 1 + countTotal(n.children || []), 0);
  const totalCount = countTotal(nodes);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-5 pb-4 border-b border-slate-200/60 bg-white/50 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center shadow-lg shadow-slate-300/30">
              <TreePine className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-[17px] flex items-center gap-2.5">
                Breakdown Structure
                <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-blue-600 text-white text-[11px] font-black shadow-sm">
                  {totalCount}
                </span>
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">Varlık hiyerarşinizi yönetin</p>
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={expandAll}
              className="text-[11px] h-8 px-3 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg font-semibold"
            >
              Tümünü Aç
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={collapseAll}
              className="text-[11px] h-8 px-3 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg font-semibold"
            >
              Kapat
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="İsim, tag no veya marka ile arayın..."
            className="pl-10 h-11 border-2 border-slate-200 rounded-xl text-sm focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 bg-white"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-slate-200 hover:bg-slate-300 flex items-center justify-center transition-colors"
            >
              <span className="text-xs text-slate-600">✕</span>
            </button>
          )}
        </div>
      </div>

      {/* Tree content */}
      <div className="flex-1 overflow-y-auto p-5">
        {filteredNodes.length === 0 ? (
          <EmptyState hasSearch={searchQuery.length > 0} />
        ) : (
          <div className="space-y-2">
            {filteredNodes.map((node) => (
              <TreeNode
                key={node.id}
                node={node}
                expandedIds={expandedIds}
                onToggle={toggleNode}
                onEdit={onEdit}
                onDelete={onDelete}
                onAddChild={onAddChild}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── TreeNode (recursive) ──────────────────────────────────────────

interface TreeNodeProps {
  node: AssetTreeNode;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
  onEdit: (node: AssetTreeNode) => void;
  onDelete: (node: AssetTreeNode) => void;
  onAddChild?: (node: AssetTreeNode) => void;
}

function TreeNode({ node, expandedIds, onToggle, onEdit, onDelete, onAddChild }: TreeNodeProps) {
  const isExpanded = expandedIds.has(node.id);
  const hasChildren = node.children && node.children.length > 0;
  const style = getDepthStyle(node.depth);
  const typeColor = getTypeColor(node.type);
  const isLeaf = node.leaf && !hasChildren;

  return (
    <div className="group/tree">
      {/* Node header */}
      <div
        className={`flex items-center gap-3 px-3.5 py-3 bg-white border border-slate-200/80 border-l-[3px] ${style.accent}
                     rounded-xl cursor-pointer select-none transition-all duration-200
                     ${style.bg} hover:shadow-md hover:border-slate-300
                     ${isExpanded ? 'shadow-sm bg-slate-50/50' : ''}`}
        onClick={() => hasChildren && onToggle(node.id)}
      >
        {/* Expand icon */}
        <span className={`w-5 h-5 flex items-center justify-center transition-transform duration-300 ${isExpanded ? 'rotate-0' : ''}`}>
          {hasChildren ? (
            isExpanded ? (
              <ChevronDown className="w-4 h-4 text-slate-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )
          ) : (
            <span className="w-2 h-2 rounded-full bg-slate-300" />
          )}
        </span>

        {/* Type icon */}
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${typeColor}`}>
          {getTypeIcon(node.type)}
        </div>

        {/* Node name */}
        <span className={`text-sm font-bold flex-1 truncate ${style.label}`}>
          {node.name}
        </span>

        {/* Tag No badge */}
        {node.tagNo && !node.tagNo.includes('-L0') && !node.tagNo.includes('-L1') && !node.tagNo.includes('-L2') && (
          <span className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200/80 text-amber-800 shrink-0">
            <Hash className="w-3 h-3 text-amber-500" />
            <span className="font-mono text-[10px] font-bold tracking-tight">{node.tagNo}</span>
          </span>
        )}

        {/* Child count badge */}
        {hasChildren && (
          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${style.badge} shrink-0`}>
            {node.descendantCount}
          </span>
        )}

        {/* Action buttons (show on hover) */}
        <div className="flex gap-1 opacity-0 group-hover/tree:opacity-100 transition-opacity duration-200 shrink-0">
          {onAddChild && (
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => { e.stopPropagation(); onAddChild(node); }}
              className="h-7 w-7 p-0 text-emerald-400 hover:text-white hover:bg-emerald-500 rounded-lg transition-all"
              title="Alt varlık ekle"
            >
              <PlusCircle className="w-3.5 h-3.5" />
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); onEdit(node); }}
            className="h-7 w-7 p-0 text-blue-400 hover:text-white hover:bg-blue-500 rounded-lg transition-all"
            title="Düzenle"
          >
            <Pencil className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); onDelete(node); }}
            className="h-7 w-7 p-0 text-red-400 hover:text-white hover:bg-red-500 rounded-lg transition-all"
            title="Sil"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Children (animated) */}
      {hasChildren && (
        <div
          className={`ml-4 mt-1 pl-5 space-y-1 relative
                       transition-all duration-300 ease-out overflow-hidden
                       ${isExpanded ? 'max-h-[8000px] opacity-100' : 'max-h-0 opacity-0'}`}
        >
          {/* Connector line */}
          <div className={`absolute left-0 top-0 bottom-2 w-px border-l-2 border-dashed ${style.line}`} />

          {node.children.map((child, idx) => (
            <div key={child.id} className="relative">
              {/* Horizontal connector */}
              <div className={`absolute -left-5 top-5 w-5 h-px border-t border-dashed ${style.line}`} />
              {/* Dot on connector */}
              <div className={`absolute -left-[22px] top-[17px] w-[7px] h-[7px] rounded-full ${style.dot} ring-2 ring-white`} />
              <TreeNode
                node={child}
                expandedIds={expandedIds}
                onToggle={onToggle}
                onEdit={onEdit}
                onDelete={onDelete}
                onAddChild={onAddChild}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Empty State ───────────────────────────────────────────────────

function EmptyState({ hasSearch }: { hasSearch: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center shadow-inner">
          <TreePine className="w-12 h-12 text-slate-300" />
        </div>
        <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-blue-500 flex items-center justify-center shadow-lg animate-pulse">
          <span className="text-white text-xs font-black">+</span>
        </div>
      </div>
      {hasSearch ? (
        <>
          <h3 className="text-lg font-bold text-slate-700">Sonuç bulunamadı</h3>
          <p className="text-sm text-slate-500 mt-2 max-w-xs leading-relaxed">
            Arama kriterlerinizle eşleşen varlık bulunamadı. Farklı bir terim deneyin.
          </p>
        </>
      ) : (
        <>
          <h3 className="text-lg font-bold text-slate-700">Varlık ağacı boş</h3>
          <p className="text-sm text-slate-500 mt-2 max-w-xs leading-relaxed">
            Sol panelden ilk varlığınızı ekleyerek kırılım yapınızı oluşturmaya başlayın.
          </p>
          <div className="mt-5 flex items-center gap-2 text-xs text-slate-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            Lokasyon → Alt Varlık → ... → Tag No
          </div>
        </>
      )}
    </div>
  );
}
