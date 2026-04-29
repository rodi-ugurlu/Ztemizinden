import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Activity, LogOut, BarChart3, Users, Settings, AlertTriangle } from 'lucide-react';

/**
 * AdminLayout Component
 *
 * Data-heavy, dense, analytical design for operations center.
 * Dark theme with indigo accents - professional and security-focused.
 */
export default function AdminLayout() {
  const { isAuthenticated, logout, user } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col text-slate-200">
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex items-center justify-between sticky top-0 z-50 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-500 rounded flex items-center justify-center shadow-indigo-500/30 shadow-sm">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="font-semibold text-slate-100 text-sm tracking-wide">Temizinden <span className="text-slate-500 font-normal">OPS MERKEZİ</span></span>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Sistem Yönetimi</p>
          </div>
        </div>

        {isAuthenticated && (
          <nav className="flex items-center gap-6">
            <NavLink
              to="/admin/dashboard"
              className={({ isActive }) =>
                `flex items-center gap-2 text-xs font-medium transition-colors uppercase tracking-wider ${
                  isActive ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              <BarChart3 className="w-4 h-4" /> Dashboard
            </NavLink>
            <NavLink
              to="/admin/providers"
              className={({ isActive }) =>
                `flex items-center gap-2 text-xs font-medium transition-colors uppercase tracking-wider ${
                  isActive ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              <Users className="w-4 h-4" /> Sağlayıcılar
            </NavLink>
            <NavLink
              to="/admin/dispatch"
              className={({ isActive }) =>
                `flex items-center gap-2 text-xs font-medium transition-colors uppercase tracking-wider ${
                  isActive ? 'text-indigo-400' : 'text-slate-400 hover:text-slate-200'
                }`
              }
            >
              <Activity className="w-4 h-4" /> Sevk
            </NavLink>

            <div className="flex items-center gap-4 ml-4 border-l border-slate-800 pl-6">
              <div className="text-right">
                <p className="text-xs font-medium text-slate-200">{user?.name}</p>
                <p className="text-[10px] text-slate-500 uppercase">{user?.role}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-slate-400 hover:text-white">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </nav>
        )}

        {!isAuthenticated && (
          <nav className="text-xs font-medium text-slate-400 uppercase tracking-wider">
            Sistem Yöneticisi
          </nav>
        )}
      </header>

      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>

      <footer className="bg-slate-900 border-t border-slate-800 px-6 py-2 text-center text-[10px] text-slate-500 uppercase tracking-wider">
        Kısıtlı Sistem | Yetkili Personel | Temizinden OPS MERKEZİ
      </footer>
    </div>
  );
}
