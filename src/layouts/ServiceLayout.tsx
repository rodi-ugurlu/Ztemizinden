import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { Button } from '@/components/ui/button';
import { Wrench, LogOut, TicketCheck, Users, MapPin } from 'lucide-react';

/**
 * ServiceLayout Component
 *
 * Industrial, high-contrast design for field workers and mechanics.
 * Dark theme with amber accents - action-oriented and rugged.
 */
export default function ServiceLayout() {
  const { isAuthenticated, logout, user } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/service/login');
  };

  return (
    <div className="min-h-screen bg-neutral-900 flex flex-col text-neutral-100">
      <header className="bg-neutral-950 border-b border-neutral-800 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500 rounded-sm flex items-center justify-center font-bold text-neutral-950">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <span className="font-bold text-white text-lg tracking-tight">Temizinden <span className="text-amber-500">PRO</span></span>
            <p className="text-xs text-neutral-500 uppercase tracking-wider">Servis Sağlayıcı Portalı</p>
          </div>
        </div>

        {isAuthenticated && (
          <nav className="flex items-center gap-6">
            <NavLink
              to="/service/dashboard"
              className={({ isActive }) =>
                `flex items-center gap-2 text-sm font-medium transition-colors ${
                  isActive ? 'text-amber-500' : 'text-neutral-400 hover:text-white'
                }`
              }
            >
              <TicketCheck className="w-4 h-4" /> İş Panosu
            </NavLink>
            <NavLink
              to="/service/tickets"
              className={({ isActive }) =>
                `flex items-center gap-2 text-sm font-medium transition-colors ${
                  isActive ? 'text-amber-500' : 'text-neutral-400 hover:text-white'
                }`
              }
            >
              <TicketCheck className="w-4 h-4" /> Talepler
            </NavLink>
            <NavLink
              to="/service/team"
              className={({ isActive }) =>
                `flex items-center gap-2 text-sm font-medium transition-colors ${
                  isActive ? 'text-amber-500' : 'text-neutral-400 hover:text-white'
                }`
              }
            >
              <Users className="w-4 h-4" /> Ekip
            </NavLink>

            <div className="flex items-center gap-4 ml-4 border-l border-neutral-800 pl-6">
              <div className="text-right">
                <p className="text-sm font-medium text-white">{user?.name}</p>
                <p className="text-xs text-neutral-500">{user?.role}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="text-neutral-400 hover:text-white">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </nav>
        )}

        {!isAuthenticated && (
          <nav className="text-sm font-medium text-neutral-400 uppercase tracking-wider">
            Servis Sağlayıcı Portalı
          </nav>
        )}
      </header>

      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>

      <footer className="bg-neutral-950 border-t border-neutral-800 px-6 py-3 text-center text-xs text-neutral-500">
        Temizinden PRO | Endüstriyel Servis Yönetimi
      </footer>
    </div>
  );
}
