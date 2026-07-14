import { create } from 'zustand';
import type Keycloak from 'keycloak-js';
import type { KeycloakTokenParsed } from 'keycloak-js';
import { getApiBaseUrl } from '@/lib/backendUrl';

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
  authInitialized: boolean;
  identityAvailable: boolean;
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

let identityClient: Keycloak | null = null;

export const useAuthStore = create<AuthState>((set, get) => ({
  ...emptySession,
  authInitialized: false,
  identityAvailable: false,
  isLoading: false,
  error: null,

  loginWithIdentityProvider: async (role, email) => {
    set({ isLoading: true, error: null });
    try {
      await initializeAuth();
      if (!useAuthStore.getState().identityAvailable || !identityClient) {
        throw new Error('Kimlik doğrulama servisine şu anda ulaşılamıyor.');
      }
      await identityClient.login({
        loginHint: email?.trim() || undefined,
        redirectUri: `${window.location.origin}/${role}/dashboard`,
      });
    } catch (error) {
      set({ isLoading: false, error: friendlyIdentityError(error) });
      throw error;
    }
  },

  logout: async () => {
    const role = get().role ?? 'customer';
    set({ ...emptySession, isLoading: false, error: null });
    if (!identityClient?.authenticated) {
      window.location.assign(`/${role}/login`);
      return;
    }
    try {
      await identityClient.logout({
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
        identityClient?.authenticated &&
        identityClient.token &&
        !identityClient.isTokenExpired(0)
    ),
}));

let initializationPromise: Promise<void> | null = null;

export async function initializeAuth(): Promise<void> {
  if (initializationPromise) return initializationPromise;

  initializationPromise = initializeIdentityProvider();
  return initializationPromise;
}

async function initializeIdentityProvider(): Promise<void> {
  try {
    const keycloak = await getIdentityClient();
    const authenticated = await keycloak.init({
      onLoad: 'check-sso',
      pkceMethod: 'S256',
      checkLoginIframe: false,
      silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
      silentCheckSsoFallback: false,
      messageReceiveTimeout: 3000,
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
    useAuthStore.setState({
      authInitialized: true,
      identityAvailable: true,
      isLoading: false,
    });
  } catch (error) {
    console.warn('Güvenli oturum başlatılamadı.', error);
    useAuthStore.setState({
      ...emptySession,
      authInitialized: true,
      identityAvailable: false,
      isLoading: false,
      error: null,
    });
  }
}

export async function getFreshAccessToken(): Promise<string | null> {
  const keycloak = identityClient;
  if (!keycloak) return null;
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
  const keycloak = identityClient;
  if (!keycloak) return null;
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
  const keycloak = identityClient;
  if (!keycloak) {
    clearLocalSession();
    return;
  }
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
    authInitialized: true,
    identityAvailable: true,
    isLoading: false,
    error: null,
  });
}

function clearLocalSession() {
  useAuthStore.setState({
    ...emptySession,
    authInitialized: true,
    identityAvailable: true,
    isLoading: false,
    error: null,
  });
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

function friendlyIdentityError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : '';
  if (
    message.includes('timeout') ||
    message.includes('iframe') ||
    message.includes('network') ||
    message.includes('failed to fetch') ||
    message.includes('ulaşılamıyor')
  ) {
    return 'Giriş servisine şu anda ulaşılamıyor. Lütfen kısa bir süre sonra tekrar deneyin.';
  }
  return 'Güvenli giriş başlatılamadı. Lütfen tekrar deneyin.';
}

async function getIdentityClient(): Promise<Keycloak> {
  if (identityClient) return identityClient;
  const module = await import('@/lib/keycloak');
  identityClient = module.keycloak;
  return identityClient;
}
