import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Home, ClipboardList, History, LogOut } from 'lucide-react';

/**
 * CustomerLayout Component
 *
 * Clean, urgent, and premium design.
 * Light theme with vibrant red accents - modern consumer experience.
 */
export default function CustomerLayout() {
  const { isAuthenticated, logout, user } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/customer/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center shadow-sm">
            <Home className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-bold text-slate-900 text-lg tracking-tight">Temizinden</span>
            <p className="text-xs text-slate-500">Müşteri Portalı</p>
          </div>
        </div>

        {isAuthenticated && (
          <nav className="flex items-center gap-6">
            <NavLink
              to="/customer/dashboard"
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${isActive ? 'text-red-600' : 'text-slate-600 hover:text-slate-900'}`
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/customer/assets"
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${isActive ? 'text-red-600' : 'text-slate-600 hover:text-slate-900'}`
              }
            >
              Varlıklar
            </NavLink>
            <NavLink
              to="/customer/requests"
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${isActive ? 'text-red-600' : 'text-slate-600 hover:text-slate-900'}`
              }
            >
              Talepler
            </NavLink>

            <div className="flex items-center gap-4 ml-4 border-l border-slate-200 pl-6">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900">{user?.name}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-500 hover:text-slate-900">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </nav>
        )}

        {!isAuthenticated && (
          <nav className="text-sm font-medium text-slate-600">
            Müşteri Portalı
          </nav>
        )}
      </header>

      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-slate-200 px-6 py-4 text-center text-sm text-slate-500">
        © 2026 Temizinden. Tüm hakları saklıdır.
      </footer>
    </div>
  );
}
