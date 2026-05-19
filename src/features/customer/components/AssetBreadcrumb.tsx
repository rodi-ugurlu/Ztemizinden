import { ChevronRight } from 'lucide-react';
import type { AssetBreadcrumbItem } from '@/store/useCustomerStore';

interface AssetBreadcrumbProps {
  items: AssetBreadcrumbItem[];
  currentName?: string;
  onNavigate: (assetId: string) => void;
}

/**
 * Breadcrumb navigation for Asset Tree.
 * Shows the path from root to the currently selected node.
 */
export default function AssetBreadcrumb({ items, currentName, onNavigate }: AssetBreadcrumbProps) {
  return (
    <nav className="flex items-center gap-1 text-sm flex-wrap" aria-label="Breadcrumb">
      {items.map((item, index) => (
        <span key={item.id} className="flex items-center gap-1">
          {index > 0 && (
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          )}
          <button
            onClick={() => onNavigate(item.id)}
            className="px-2 py-0.5 rounded-md text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 
                       transition-all duration-200 font-medium truncate max-w-[140px]"
            title={item.name}
          >
            {item.name}
          </button>
        </span>
      ))}
      {currentName && (
        <span className="flex items-center gap-1">
          {items.length > 0 && (
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          )}
          <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700 font-semibold truncate max-w-[180px]">
            {currentName}
          </span>
        </span>
      )}
    </nav>
  );
}
