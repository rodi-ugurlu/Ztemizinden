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
  login: (role: UserRole, userData: Partial<User>) => void;
  loginWithPassword: (role: Exclude<UserRole, null>, email: string, password: string) => Promise<void>;
  logout: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Computed
  hasRole: (role: UserRole) => boolean;
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
      },

      loginWithPassword: async (role, email, password) => {
        set({ isLoading: true, error: null });
        try {
          if (import.meta.env.VITE_AUTH_MODE === 'demo') {
            get().login(role, { email });
            set({ isLoading: false });
            return;
          }

          const session = await requestKeycloakToken(email, password);
          const claims = decodeJwtPayload(session.access_token);
          const resolvedRole = resolveRoleFromClaims(claims) ?? resolveDemoRole(email) ?? role;
          const demoProfile = getDemoProfile(email);
          const user: User = {
            id: resolvePrincipalId(email, claims.sub, resolvedRole),
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

interface KeycloakTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
}

interface JwtClaims {
  sub?: string;
  email?: string;
  name?: string;
  realm_access?: {
    roles?: string[];
  };
}

async function requestKeycloakToken(email: string, password: string): Promise<KeycloakTokenResponse> {
  const keycloakUrl = import.meta.env.VITE_KEYCLOAK_URL || 'http://localhost:8081';
  const realm = import.meta.env.VITE_KEYCLOAK_REALM || 'ztemizinden';
  const clientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID || 'ztemizinden-frontend';
  const body = new URLSearchParams({
    grant_type: 'password',
    client_id: clientId,
    username: email,
    password,
  });

  const response = await fetch(`${keycloakUrl}/realms/${realm}/protocol/openid-connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!response.ok) {
    throw new Error('E-posta veya sifre hatali');
  }

  return response.json();
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

function resolvePrincipalId(email: string, subject: string | undefined, role: UserRole) {
  const demoProfile = getDemoProfile(email);
  if (demoProfile) return demoProfile.id;
  if (role === 'customer' || role === 'service') return subject ?? crypto.randomUUID();
  return subject ?? 'admin-001';
}

export function getStoredAccessToken() {
  const state = useAuthStore.getState();
  if (!state.accessToken || !state.expiresAt) return null;
  if (Date.now() > state.expiresAt - 30_000) return null;
  return state.accessToken;
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
