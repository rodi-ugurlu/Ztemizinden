import { Navigate, useLocation } from 'react-router-dom';
import { resolveDemoRole, useAuthStore, type UserRole } from '@/store/useAuthStore';

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
  const { isAuthenticated, role, user } = useAuthStore();
  const location = useLocation();
  const effectiveRole = resolveDemoRole(user?.email) ?? role;

  if (!isAuthenticated) {
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
  const { isAuthenticated, role: userRole, user } = useAuthStore();
  const effectiveRole = resolveDemoRole(user?.email) ?? userRole;

  if (isAuthenticated && effectiveRole === role) {
    return <Navigate to={`/${effectiveRole}/dashboard`} replace />;
  }

  return <>{children}</>;
}
