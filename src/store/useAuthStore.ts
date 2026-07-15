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
  loginWithCredentials: (
    role: Exclude<UserRole, null>,
    email: string,
    password: string
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

interface DirectTokenSession {
  accessToken: string;
  refreshToken: string;
  idToken?: string;
  tokenParsed: MaintlyTokenClaims;
  refreshTokenParsed?: KeycloakTokenParsed;
}

const emptySession = {
  user: null,
  role: null,
  isAuthenticated: false,
} as const;

let identityClient: Keycloak | null = null;
const IDENTITY_INITIALIZATION_TIMEOUT_MS = 10_000;
const DIRECT_TOKEN_SESSION_KEY = 'maintly.directTokenSession.v1';
let directTokenSession: DirectTokenSession | null = readStoredDirectTokenSession();

export const useAuthStore = create<AuthState>((set, get) => ({
  ...emptySession,
  authInitialized: false,
  identityAvailable: false,
  isLoading: false,
  error: null,

  loginWithIdentityProvider: async (role, email) => {
    set({ isLoading: true, error: null });
    try {
      const redirectUri = `${window.location.origin}/${role}/dashboard`;

      // A direct visit to a login route must enter the authorization flow
      // immediately. Running check-sso first can leave the visible login page
      // waiting on a silent iframe while the identity service is restarting.
      if (!initializationPromise) {
        initializationPromise = initializeIdentityProvider({
          onLoad: 'login-required',
          redirectUri,
        });
        await withTimeout(initializationPromise, IDENTITY_INITIALIZATION_TIMEOUT_MS);
      } else {
        await withTimeout(initializeAuth(), IDENTITY_INITIALIZATION_TIMEOUT_MS);
      }
      if (!useAuthStore.getState().identityAvailable || !identityClient) {
        throw new Error('Kimlik doğrulama servisine şu anda ulaşılamıyor.');
      }
      if (identityClient.authenticated) {
        applyKeycloakSession();
        window.location.assign(redirectUri);
        return;
      }
      await identityClient.login({
        loginHint: email?.trim() || undefined,
        redirectUri,
      });
    } catch (error) {
      set({ isLoading: false, error: friendlyIdentityError(error) });
      throw error;
    }
  },

  loginWithCredentials: async (role, email, password) => {
    set({ isLoading: true, error: null });
    try {
      const tokenResponse = await directGrant(email, password);
      const session = createDirectTokenSession(tokenResponse);
      setDirectTokenSession(session);
      applyClaimsSession(session.tokenParsed);
      if (useAuthStore.getState().role !== role) {
        clearLocalSession();
        throw new Error('role_mismatch');
      }
      window.location.assign(`/${role}/dashboard`);
    } catch (error) {
      set({ isLoading: false, error: friendlyCredentialError(error, role) });
      throw error;
    }
  },

  logout: async () => {
    const role = get().role ?? 'customer';
    const sessionToEnd = directTokenSession;
    set({ ...emptySession, isLoading: false, error: null });
    clearDirectTokenSession();
    if (sessionToEnd) {
      await revokeDirectTokenSession(sessionToEnd).catch(() => undefined);
      window.location.assign(`/${role}/login`);
      return;
    }
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
    Boolean(get().isAuthenticated && (isDirectTokenSessionUsable() || hasValidKeycloakSession())),
}));

let initializationPromise: Promise<void> | null = null;

export async function initializeAuth(): Promise<void> {
  if (initializationPromise) return initializationPromise;

  initializationPromise = initializeIdentityProvider();
  return initializationPromise;
}

async function initializeIdentityProvider(
  loginOptions?: {
    onLoad: 'login-required';
    redirectUri: string;
  }
): Promise<void> {
  try {
    if (!loginOptions && (await restoreDirectTokenSession())) {
      return;
    }

    const keycloak = await getIdentityClient();
    const authenticated = await withTimeout(
      keycloak.init({
        onLoad: loginOptions?.onLoad ?? 'check-sso',
        pkceMethod: 'S256',
        checkLoginIframe: false,
        ...(loginOptions
          ? { redirectUri: loginOptions.redirectUri }
          : {
              silentCheckSsoRedirectUri: `${window.location.origin}/silent-check-sso.html`,
              silentCheckSsoFallback: false,
            }),
        messageReceiveTimeout: 3000,
      }),
      IDENTITY_INITIALIZATION_TIMEOUT_MS
    );

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
    identityClient = null;
    initializationPromise = null;
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
  if (directTokenSession) {
    if (isAccessTokenUsable(directTokenSession, 30)) {
      return directTokenSession.accessToken;
    }
    if (isDirectTokenSessionUsable()) {
      try {
        const refreshedSession = await refreshDirectTokenSession(directTokenSession);
        setDirectTokenSession(refreshedSession);
        applyClaimsSession(refreshedSession.tokenParsed);
        return refreshedSession.accessToken;
      } catch {
        clearLocalSession();
        return null;
      }
    }
    clearLocalSession();
    return null;
  }

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
  if (directTokenSession) {
    return isAccessTokenUsable(directTokenSession, 0) ? directTokenSession.accessToken : null;
  }

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
  applyClaimsSession(claims, Boolean(keycloak.authenticated));
}

function applyClaimsSession(claims?: MaintlyTokenClaims, authenticated = true) {
  const role = resolveRoleFromClaims(claims);
  if (!claims || !role || !authenticated) {
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
  clearDirectTokenSession();
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
  identityClient = module.createKeycloakClient();
  return identityClient;
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timeoutId = window.setTimeout(
      () => reject(new Error('Identity provider initialization timeout')),
      timeoutMs
    );
    promise.then(
      (value) => {
        window.clearTimeout(timeoutId);
        resolve(value);
      },
      (error) => {
        window.clearTimeout(timeoutId);
        reject(error);
      }
    );
  });
}

interface DirectGrantResponse {
  access_token: string;
  refresh_token: string;
  id_token?: string;
  token_type: string;
  expires_in: number;
}

async function directGrant(email: string, password: string): Promise<DirectGrantResponse> {
  const keycloakUrl = (import.meta.env.VITE_KEYCLOAK_URL?.trim() || 'http://localhost:8081').replace(/\/+$/, '');
  const realm = import.meta.env.VITE_KEYCLOAK_REALM?.trim() || 'ztemizinden';
  const clientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID?.trim() || 'ztemizinden-web';

  const body = new URLSearchParams({
    grant_type: 'password',
    client_id: clientId,
    username: email.trim(),
    password,
    scope: 'openid',
  });

  const response = await fetch(`${keycloakUrl}/realms/${realm}/protocol/openid-connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  }).catch(() => {
    throw new Error('network');
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({})) as { error_description?: string; error?: string };
    const description = (payload.error_description || payload.error || '').toLowerCase();
    if (description.includes('disabled')) {
      throw new Error('account_disabled');
    }
    if (
      description.includes('not fully set up') ||
      description.includes('required action') ||
      description.includes('verify_email') ||
      description.includes('verify email')
    ) {
      throw new Error('account_setup_required');
    }
    if (response.status === 401 || payload.error === 'invalid_grant') {
      throw new Error('invalid_credentials');
    }
    throw new Error(payload.error_description || payload.error || 'unknown');
  }

  return response.json() as Promise<DirectGrantResponse>;
}

function createDirectTokenSession(tokenResponse: DirectGrantResponse): DirectTokenSession {
  const tokenParsed = decodeJwt<MaintlyTokenClaims>(tokenResponse.access_token);
  if (!tokenParsed) throw new Error('invalid_token');

  return {
    accessToken: tokenResponse.access_token,
    refreshToken: tokenResponse.refresh_token,
    idToken: tokenResponse.id_token,
    tokenParsed,
    refreshTokenParsed: decodeJwt<KeycloakTokenParsed>(tokenResponse.refresh_token) ?? undefined,
  };
}

function setDirectTokenSession(session: DirectTokenSession) {
  directTokenSession = session;
  identityClient = null;
  initializationPromise = null;
  writeStoredDirectTokenSession(session);
}

function clearDirectTokenSession() {
  directTokenSession = null;
  removeStoredDirectTokenSession();
}

async function restoreDirectTokenSession(): Promise<boolean> {
  if (!directTokenSession) {
    directTokenSession = readStoredDirectTokenSession();
  }
  if (!directTokenSession) return false;

  if (isAccessTokenUsable(directTokenSession, 0)) {
    if (!resolveRoleFromClaims(directTokenSession.tokenParsed)) {
      clearDirectTokenSession();
      return false;
    }
    applyClaimsSession(directTokenSession.tokenParsed);
    return true;
  }

  if (!isDirectTokenSessionUsable()) {
    clearDirectTokenSession();
    return false;
  }

  try {
    const refreshedSession = await refreshDirectTokenSession(directTokenSession);
    if (!resolveRoleFromClaims(refreshedSession.tokenParsed)) {
      clearDirectTokenSession();
      return false;
    }
    setDirectTokenSession(refreshedSession);
    applyClaimsSession(refreshedSession.tokenParsed);
    return true;
  } catch {
    clearDirectTokenSession();
    return false;
  }
}

async function refreshDirectTokenSession(session: DirectTokenSession): Promise<DirectTokenSession> {
  const keycloakUrl = (import.meta.env.VITE_KEYCLOAK_URL?.trim() || 'http://localhost:8081').replace(/\/+$/, '');
  const realm = import.meta.env.VITE_KEYCLOAK_REALM?.trim() || 'ztemizinden';
  const clientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID?.trim() || 'ztemizinden-web';

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: clientId,
    refresh_token: session.refreshToken,
  });

  const response = await fetch(`${keycloakUrl}/realms/${realm}/protocol/openid-connect/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  }).catch(() => {
    throw new Error('network');
  });

  if (!response.ok) throw new Error('invalid_session');
  return createDirectTokenSession((await response.json()) as DirectGrantResponse);
}

async function revokeDirectTokenSession(session: DirectTokenSession): Promise<void> {
  const keycloakUrl = (import.meta.env.VITE_KEYCLOAK_URL?.trim() || 'http://localhost:8081').replace(/\/+$/, '');
  const realm = import.meta.env.VITE_KEYCLOAK_REALM?.trim() || 'ztemizinden';
  const clientId = import.meta.env.VITE_KEYCLOAK_CLIENT_ID?.trim() || 'ztemizinden-web';

  const body = new URLSearchParams({
    client_id: clientId,
    refresh_token: session.refreshToken,
  });

  await fetch(`${keycloakUrl}/realms/${realm}/protocol/openid-connect/logout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });
}

function hasValidKeycloakSession() {
  return Boolean(
    identityClient?.authenticated &&
      identityClient.token &&
      !identityClient.isTokenExpired(0)
  );
}

function isDirectTokenSessionUsable() {
  if (!directTokenSession) return false;
  const expiryClaims = directTokenSession.refreshTokenParsed ?? directTokenSession.tokenParsed;
  return !isJwtExpired(expiryClaims, 0);
}

function isAccessTokenUsable(session: DirectTokenSession, minValiditySeconds: number) {
  return !isJwtExpired(session.tokenParsed, minValiditySeconds);
}

function isJwtExpired(claims: KeycloakTokenParsed | undefined, minValiditySeconds: number) {
  if (typeof claims?.exp !== 'number') return true;
  return claims.exp - Math.ceil(Date.now() / 1000) <= minValiditySeconds;
}

function readStoredDirectTokenSession(): DirectTokenSession | null {
  try {
    const rawValue = window.sessionStorage.getItem(DIRECT_TOKEN_SESSION_KEY);
    if (!rawValue) return null;
    const stored = JSON.parse(rawValue) as {
      accessToken?: string;
      refreshToken?: string;
      idToken?: string;
    };
    if (!stored.accessToken || !stored.refreshToken) return null;
    return createDirectTokenSession({
      access_token: stored.accessToken,
      refresh_token: stored.refreshToken,
      id_token: stored.idToken,
      token_type: 'Bearer',
      expires_in: 0,
    });
  } catch {
    removeStoredDirectTokenSession();
    return null;
  }
}

function writeStoredDirectTokenSession(session: DirectTokenSession) {
  try {
    window.sessionStorage.setItem(
      DIRECT_TOKEN_SESSION_KEY,
      JSON.stringify({
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
        idToken: session.idToken,
      })
    );
  } catch {
    // In-memory auth still works if storage is unavailable.
  }
}

function removeStoredDirectTokenSession() {
  try {
    window.sessionStorage.removeItem(DIRECT_TOKEN_SESSION_KEY);
  } catch {
    // Storage may be unavailable in restricted browser modes.
  }
}

function decodeJwt<T>(token: string): T | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
    const paddedPayload = normalizedPayload.padEnd(
      normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4),
      '='
    );
    const binary = window.atob(paddedPayload);
    const json = decodeURIComponent(
      Array.from(binary)
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join('')
    );
    return JSON.parse(json) as T;
  } catch {
    return null;
  }
}

function friendlyCredentialError(error: unknown, requestedRole?: Exclude<UserRole, null>) {
  const message = error instanceof Error ? error.message.toLowerCase() : '';
  if (message.includes('invalid_credentials') || message.includes('invalid_grant')) {
    return 'E-posta adresi veya şifre hatalı. Lütfen tekrar deneyin.';
  }
  if (message.includes('account_disabled')) {
    if (requestedRole === 'service') {
      return 'Servis hesabınız operasyon onayı bekliyor. Onay tamamlandığında giriş yapabilirsiniz.';
    }
    return 'Hesabınız devre dışı bırakılmış. Yönetici ile iletişime geçin.';
  }
  if (message.includes('account_setup_required')) {
    return 'Hesap kurulumu tamamlanmadığı için giriş yapılamadı. E-posta doğrulama veya yönetici onayı gerekebilir.';
  }
  if (message.includes('role_mismatch')) {
    return 'Bu kullanıcı bilgileri bu portala ait değil. Lütfen doğru giriş ekranını kullanın.';
  }
  if (message.includes('network') || message.includes('failed to fetch')) {
    return 'Giriş servisine şu anda ulaşılamıyor. Lütfen kısa bir süre sonra tekrar deneyin.';
  }
  if (message.includes('account') && message.includes('disabled')) {
    return 'Hesabınız devre dışı bırakılmış. Yönetici ile iletişime geçin.';
  }
  return 'Giriş yapılamadı. Lütfen tekrar deneyin.';
}
