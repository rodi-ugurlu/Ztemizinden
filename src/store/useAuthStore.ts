import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'customer' | 'service' | 'admin' | null;

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  role: UserRole;
  accessToken: string | null;
  refreshToken: string | null;
  expiresAt: number | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (role: UserRole, userData: Partial<User>) => User;
  loginWithPassword: (role: Exclude<UserRole, null>, email: string, password: string) => Promise<User>;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Computed
  hasRole: (role: UserRole) => boolean;
  isSessionValid: () => boolean;
}

/**
 * Authentication Store - Zustand
 *
 * Manages user sessions across three distinct portals:
 * - Customer Portal (Mod A)
 * - Service Provider Portal (Mod X)
 * - Admin/Operations Portal
 *
 * Uses persist middleware to maintain session across browser refreshes.
 * Session data is cleared on logout.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      role: null,
      accessToken: null,
      refreshToken: null,
      expiresAt: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: (role, userData) => {
        const resolvedRole = resolveDemoRole(userData.email) ?? role;
        const demoProfile = getDemoProfile(userData.email);
        const user: User = {
          id: userData.id || demoProfile?.id || crypto.randomUUID(),
          email: userData.email || '',
          name: userData.name || demoProfile?.name || 'User',
          role: resolvedRole,
          avatar: userData.avatar,
        };
        set({ user, role: resolvedRole, isAuthenticated: true, error: null });
        return user;
      },

      loginWithPassword: async (role, email, password) => {
        set({ isLoading: true, error: null });
        try {
          if (import.meta.env.VITE_AUTH_MODE === 'demo') {
            const user = get().login(role, { email });
            set({ isLoading: false });
            return user;
          }

          const session = await requestBackendToken(email, password);
          const claims = decodeJwtPayload(session.access_token);
          const resolvedRole = resolveRoleFromClaims(claims) ?? resolveDemoRole(email) ?? role;
          const demoProfile = getDemoProfile(email);
          const user: User = {
            id: resolvePrincipalId(email, claims, resolvedRole),
            email: claims.email ?? email,
            name: claims.name ?? demoProfile?.name ?? email,
            role: resolvedRole,
          };

          set({
            user,
            role: resolvedRole,
            accessToken: session.access_token,
            refreshToken: session.refresh_token ?? null,
            expiresAt: Date.now() + session.expires_in * 1000,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          return user;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Giris basarisiz';
          set({ error: message, isLoading: false, isAuthenticated: false, accessToken: null, refreshToken: null, expiresAt: null });
          throw error;
        }
      },

      logout: () => {
        set({
          user: null,
          role: null,
          accessToken: null,
          refreshToken: null,
          expiresAt: null,
          isAuthenticated: false,
          error: null,
        });
      },

      setLoading: (loading) => set({ isLoading: loading }),

      setError: (error) => set({ error }),

      hasRole: (role) => get().role === role,

      isSessionValid: () => {
        if (!get().isAuthenticated) return false;
        if (import.meta.env.VITE_AUTH_MODE === 'demo') return true;
        const expiresAt = get().expiresAt;
        return Boolean(get().accessToken && expiresAt && Date.now() < expiresAt - 30_000);
      },
    }),
    {
      name: 'emaintenance-auth-storage',
      partialize: (state) => ({
        user: state.user,
        role: state.role,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        expiresAt: state.expiresAt,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

interface AuthTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

interface JwtClaims {
  sub?: string;
  email?: string;
  name?: string;
  customerId?: string;
  providerId?: string;
  realm_access?: {
    roles?: string[];
  };
}

async function requestBackendToken(email: string, password: string): Promise<AuthTokenResponse> {
  const apiUrl = normalizedApiUrl();
  let response: Response;
  try {
    response = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
      },
      body: JSON.stringify({ email, password }),
    });
  } catch {
    throw new Error('Backend bağlantısı kurulamadı. Ngrok veya CORS ayarlarını kontrol edin.');
  }

  if (!response.ok) {
    throw new Error(await authErrorMessage(response));
  }

  return response.json();
}

function normalizedApiUrl() {
  return (import.meta.env.VITE_API_URL || 'http://localhost:8080/api').replace(/\/+$/, '');
}

async function authErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as { detail?: string; reason?: string; title?: string };
    return payload.detail || payload.reason || payload.title || 'Giriş başarısız';
  } catch {
    return 'Giriş başarısız';
  }
}

function decodeJwtPayload(token: string): JwtClaims {
  const payload = token.split('.')[1];
  if (!payload) return {};
  const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(normalized.length + (4 - (normalized.length % 4)) % 4, '=');
  return JSON.parse(atob(padded));
}

function resolveRoleFromClaims(claims: JwtClaims): Exclude<UserRole, null> | null {
  const roles = claims.realm_access?.roles ?? [];
  if (roles.includes('ADMIN')) return 'admin';
  if (roles.includes('SERVICE')) return 'service';
  if (roles.includes('CUSTOMER')) return 'customer';
  return null;
}

function resolvePrincipalId(email: string, claims: JwtClaims, role: UserRole) {
  const demoProfile = getDemoProfile(email);
  if (demoProfile) return demoProfile.id;
  if (role === 'customer') return claims.customerId ?? claims.sub ?? crypto.randomUUID();
  if (role === 'service') return claims.providerId ?? claims.sub ?? crypto.randomUUID();
  return claims.sub ?? 'admin-001';
}

export function getStoredAccessToken() {
  const state = useAuthStore.getState();
  if (!state.accessToken || !state.expiresAt) return null;
  if (Date.now() > state.expiresAt - 30_000) return null;
  return state.accessToken;
}

export function getAuthLoginPath(role?: UserRole) {
  return `/${role ?? useAuthStore.getState().role ?? 'customer'}/login`;
}

export function clearAuthSession() {
  useAuthStore.getState().logout();
}

export function resolveDemoRole(email?: string): Exclude<UserRole, null> | null {
  switch (email?.trim().toLowerCase()) {
    case 'customer@demo.com':
      return 'customer';
    case 'service@demo.com':
      return 'service';
    case 'admin@demo.com':
      return 'admin';
    default:
      return null;
  }
}

interface DemoProfile {
  id: string;
  name: string;
}

function getDemoProfile(email?: string): DemoProfile | null {
  switch (email?.trim().toLowerCase()) {
    case 'customer@demo.com':
      return { id: 'cust-001', name: 'Rodi Uğurlu' };
    case 'service@demo.com':
      return { id: 'sp-001', name: 'Servis Sağlayıcı' };
    case 'admin@demo.com':
      return { id: 'admin-001', name: 'Operasyon Merkezi' };
    default:
      return null;
  }
}

/**
 * Hook to check if user has a specific role
 */
export function useHasRole(role: UserRole) {
  return useAuthStore((state) => state.role === role);
}

/**
 * Hook to get current user data
 */
export function useCurrentUser() {
  return useAuthStore((state) => state.user);
}
