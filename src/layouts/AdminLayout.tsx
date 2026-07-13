import { Outlet, NavLink } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Activity, LogOut, BarChart3, Users } from 'lucide-react';
import logoImg from '@/assets/logo.png';

/**
 * AdminLayout Component
 *
 * Standard white and red portal shell for operations.
 */
export default function AdminLayout() {
  const { isAuthenticated, logout, user } = useAuthStore();

  const handleLogout = () => {
    void logout();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <img src={logoImg} alt="Maintly Logo" className="h-10 w-auto object-contain" />
          <div>
            <span className="font-bold text-slate-900 text-lg tracking-tight">Maintly</span>
            <p className="text-xs text-slate-500">Operasyon Portalı</p>
          </div>
        </div>

        {isAuthenticated && (
          <nav className="w-full lg:w-auto flex items-center gap-3 sm:gap-6 overflow-x-auto pb-1 lg:pb-0">
            <NavLink
              to="/admin/dashboard"
              className={({ isActive }) =>
                `flex items-center gap-2 text-xs font-medium transition-colors uppercase tracking-wider ${
                  isActive ? 'text-red-600' : 'text-slate-600 hover:text-slate-900'
                }`
              }
            >
              <BarChart3 className="w-4 h-4" /> Dashboard
            </NavLink>
            <NavLink
              to="/admin/providers"
              className={({ isActive }) =>
                `flex items-center gap-2 text-xs font-medium transition-colors uppercase tracking-wider ${
                  isActive ? 'text-red-600' : 'text-slate-600 hover:text-slate-900'
                }`
              }
            >
              <Users className="w-4 h-4" /> Sağlayıcılar
            </NavLink>
            <NavLink
              to="/admin/dispatch"
              className={({ isActive }) =>
                `flex items-center gap-2 text-xs font-medium transition-colors uppercase tracking-wider ${
                  isActive ? 'text-red-600' : 'text-slate-600 hover:text-slate-900'
                }`
              }
            >
              <Activity className="w-4 h-4" /> Sevk
            </NavLink>

            <div className="flex items-center gap-2 sm:gap-4 ml-auto lg:ml-4 border-l border-slate-200 pl-3 sm:pl-6">
              <div className="hidden md:block text-right">
                <p className="text-sm font-medium text-slate-900">{user?.name}</p>
                <p className="text-xs text-slate-500">{user?.email}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-500 hover:text-slate-900 shrink-0">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </nav>
        )}

        {!isAuthenticated && (
          <nav className="text-sm font-medium text-slate-600">
            Sistem Yöneticisi
          </nav>
        )}
      </header>

      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>

      <footer className="bg-white border-t border-slate-200 px-6 py-4 text-center text-sm text-slate-500">
        © 2026 Maintly. Tüm hakları saklıdır.
      </footer>
    </div>
  );
}
