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
  const { isAuthenticated, role, isSessionValid, logout } = useAuthStore();
  const location = useLocation();
  const effectiveRole = role;
  const hasValidSession = isSessionValid();

  useEffect(() => {
    if (isAuthenticated && !hasValidSession) {
      void logout();
    }
  }, [hasValidSession, isAuthenticated, logout]);

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
  const { isAuthenticated, role: userRole, isSessionValid, logout } = useAuthStore();
  const effectiveRole = userRole;
  const hasValidSession = isSessionValid();

  useEffect(() => {
    if (isAuthenticated && !hasValidSession) {
      void logout();
    }
  }, [hasValidSession, isAuthenticated, logout]);

  if (isAuthenticated && hasValidSession && effectiveRole === role) {
    return <Navigate to={`/${effectiveRole}/dashboard`} replace />;
  }

  return <>{children}</>;
}
