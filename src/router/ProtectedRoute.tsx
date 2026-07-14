import { Navigate, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore, type UserRole } from '@/store/useAuthStore';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole: UserRole;
}

/**
 * ProtectedRoute Component
 *
 * Guards routes based on authentication state and user role.
 * - Redirects unauthenticated users to their portal's login page
 * - Redirects authenticated users with wrong role to their correct portal
 */
export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { authInitialized, isAuthenticated, role, isSessionValid, logout } = useAuthStore();
  const location = useLocation();
  const effectiveRole = role;
  const hasValidSession = isSessionValid();

  useEffect(() => {
    if (authInitialized && isAuthenticated && !hasValidSession) {
      void logout();
    }
  }, [authInitialized, hasValidSession, isAuthenticated, logout]);

  if (!authInitialized) {
    return <ProtectedRouteLoading />;
  }

  if (!isAuthenticated || !hasValidSession) {
    // Redirect to the appropriate login page based on the required role
    const loginPath = `/${requiredRole}/login`;
    return <Navigate to={loginPath} state={{ from: location }} replace />;
  }

  // If user is authenticated but has a different role, redirect to their correct dashboard
  if (effectiveRole !== requiredRole) {
    const redirectPath = effectiveRole ? `/${effectiveRole}/dashboard` : '/';
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
}

/**
 * PublicRoute Component
 *
 * Prevents authenticated users from accessing login pages.
 * Redirects them to their respective dashboard instead.
 */
export function PublicRoute({ children, role }: { children: React.ReactNode; role: UserRole }) {
  const { authInitialized, isAuthenticated, role: userRole, isSessionValid, logout } = useAuthStore();
  const effectiveRole = userRole;
  const hasValidSession = isSessionValid();

  useEffect(() => {
    if (authInitialized && isAuthenticated && !hasValidSession) {
      void logout();
    }
  }, [authInitialized, hasValidSession, isAuthenticated, logout]);

  if (authInitialized && isAuthenticated && hasValidSession && effectiveRole === role) {
    return <Navigate to={`/${effectiveRole}/dashboard`} replace />;
  }

  return <>{children}</>;
}

function ProtectedRouteLoading() {
  return (
    <div className="min-h-screen bg-slate-50 px-6 flex items-center justify-center">
      <div className="text-center" role="status" aria-live="polite">
        <div className="relative mx-auto mb-5 h-14 w-14">
          <div className="absolute inset-0 rounded-2xl bg-red-100 animate-ping" />
          <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-red-600 text-xl font-black text-white shadow-lg shadow-red-200">
            M
          </div>
        </div>
        <p className="text-lg font-extrabold tracking-tight text-slate-900">Maintly</p>
        <p className="mt-1 text-sm text-slate-500">Güvenli oturum hazırlanıyor...</p>
      </div>
    </div>
  );
}
