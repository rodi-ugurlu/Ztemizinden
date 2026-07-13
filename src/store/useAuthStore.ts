import { create } from 'zustand';
import type { KeycloakTokenParsed } from 'keycloak-js';
import { getApiBaseUrl } from '@/lib/backendUrl';
import { keycloak } from '@/lib/keycloak';

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
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  loginWithIdentityProvider: (
    role: Exclude<UserRole, null>,
    email?: string
  ) => Promise<void>;
  logout: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  hasRole: (role: UserRole) => boolean;
  isSessionValid: () => boolean;
}

interface MaintlyTokenClaims extends KeycloakTokenParsed {
  email?: string;
  name?: string;
  preferred_username?: string;
  customerId?: string;
  providerId?: string;
  realm_access?: {
    roles: string[];
  };
}

const emptySession = {
  user: null,
  role: null,
  isAuthenticated: false,
} as const;

export const useAuthStore = create<AuthState>((set, get) => ({
  ...emptySession,
  isLoading: true,
  error: null,

  loginWithIdentityProvider: async (role, email) => {
    set({ isLoading: true, error: null });
    try {
      await keycloak.login({
        loginHint: email?.trim() || undefined,
        redirectUri: `${window.location.origin}/${role}/dashboard`,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Keycloak giriş ekranı açılamadı.';
      set({ isLoading: false, error: message });
      throw error;
    }
  },

  logout: async () => {
    const role = get().role ?? 'customer';
    set({ ...emptySession, isLoading: false, error: null });
    if (!keycloak.authenticated) {
      window.location.assign(`/${role}/login`);
      return;
    }
    try {
      await keycloak.logout({
        redirectUri: `${window.location.origin}/${role}/login`,
      });
    } catch {
      window.location.assign(`/${role}/login`);
    }
  },

  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  hasRole: (role) => get().role === role,
  isSessionValid: () =>
    Boolean(
      get().isAuthenticated &&
        keycloak.authenticated &&
        keycloak.token &&
        !keycloak.isTokenExpired(0)
    ),
}));

export async function initializeAuth(): Promise<void> {
  useAuthStore.setState({ isLoading: true, error: null });
  try {
    const authenticated = await keycloak.init({
      onLoad: 'check-sso',
      pkceMethod: 'S256',
      checkLoginIframe: true,
      silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
    });

    if (authenticated) {
      applyKeycloakSession();
    } else {
      clearLocalSession();
    }

    keycloak.onAuthSuccess = applyKeycloakSession;
    keycloak.onAuthRefreshSuccess = applyKeycloakSession;
    keycloak.onAuthLogout = clearLocalSession;
    keycloak.onTokenExpired = () => {
      void keycloak
        .updateToken(30)
        .then(applyKeycloakSession)
        .catch(() => useAuthStore.getState().logout());
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : 'Kimlik doğrulama servisine bağlanılamadı.';
    useAuthStore.setState({ ...emptySession, isLoading: false, error: message });
  }
}

export async function getFreshAccessToken(): Promise<string | null> {
  if (!keycloak.authenticated || !keycloak.token) return null;
  try {
    await keycloak.updateToken(30);
    return keycloak.token ?? null;
  } catch {
    await useAuthStore.getState().logout();
    return null;
  }
}

export function getStoredAccessToken(): string | null {
  if (!keycloak.authenticated || !keycloak.token || keycloak.isTokenExpired(0)) return null;
  return keycloak.token;
}

export async function requestPasswordReset(email: string): Promise<string> {
  const response = await fetch(`${getApiBaseUrl()}/auth/forgot-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
    },
    body: JSON.stringify({ email }),
  }).catch(() => {
    throw new Error('Backend bağlantısı kurulamadı. API adresini ve sunucu erişimini kontrol edin.');
  });

  if (!response.ok) throw new Error(await authErrorMessage(response));
  const payload = (await response.json()) as { message: string };
  return payload.message;
}

export function getAuthLoginPath(role?: UserRole) {
  return `/${role ?? useAuthStore.getState().role ?? 'customer'}/login`;
}

export function clearAuthSession() {
  void useAuthStore.getState().logout();
}

export function resolveDemoRole(): null {
  return null;
}

export function useHasRole(role: UserRole) {
  return useAuthStore((state) => state.role === role);
}

export function useCurrentUser() {
  return useAuthStore((state) => state.user);
}

function applyKeycloakSession() {
  const claims = keycloak.tokenParsed as MaintlyTokenClaims | undefined;
  const role = resolveRoleFromClaims(claims);
  if (!claims || !role || !keycloak.authenticated) {
    clearLocalSession();
    return;
  }

  const email = claims.email ?? claims.preferred_username ?? '';
  const user: User = {
    id: resolvePrincipalId(claims, role),
    email,
    name: claims.name ?? email,
    role,
  };
  useAuthStore.setState({
    user,
    role,
    isAuthenticated: true,
    isLoading: false,
    error: null,
  });
}

function clearLocalSession() {
  useAuthStore.setState({ ...emptySession, isLoading: false, error: null });
}

function resolveRoleFromClaims(
  claims?: MaintlyTokenClaims
): Exclude<UserRole, null> | null {
  const roles = claims?.realm_access?.roles ?? [];
  if (roles.includes('ADMIN')) return 'admin';
  if (roles.includes('SERVICE')) return 'service';
  if (roles.includes('CUSTOMER')) return 'customer';
  return null;
}

function resolvePrincipalId(claims: MaintlyTokenClaims, role: Exclude<UserRole, null>) {
  if (role === 'customer') return claims.customerId ?? claims.sub ?? '';
  if (role === 'service') return claims.providerId ?? claims.sub ?? '';
  return claims.sub ?? '';
}

async function authErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as { detail?: string; reason?: string; title?: string };
    return payload.detail || payload.reason || payload.title || 'İşlem başarısız';
  } catch {
    return 'İşlem başarısız';
  }
}
