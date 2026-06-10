import { clearAuthSession, getAuthLoginPath, getStoredAccessToken, useAuthStore } from '@/store/useAuthStore';
import { getApiBaseUrl, getApiRootUrl } from '@/lib/backendUrl';

const BASE_URL = getApiBaseUrl();
const API_ROOT_URL = getApiRootUrl();

interface RequestOptions extends RequestInit {
  params?: Record<string, string>;
}

export interface UploadResponse {
  url: string;
  originalFileName: string;
  storedFileName: string;
  contentType: string;
  size: number;
  providerDocumentId?: string;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  let url = resolveUrl(endpoint);
  
  if (options.params) {
    const searchParams = new URLSearchParams(options.params);
    url += `?${searchParams.toString()}`;
  }

  const headers = new Headers(options.headers);
  const isFormData = options.body instanceof FormData;
  if (!isFormData && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  
  // Ngrok uyarı sayfasını atlamak için gerekli header
  headers.set('ngrok-skip-browser-warning', 'true');

  const token = getStoredAccessToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  let response: Response;
  try {
    response = await fetch(url, config);
  } catch {
    throw new Error(networkErrorMessage());
  }

  if (response.status === 401) {
    const loginPath = getAuthLoginPath(useAuthStore.getState().role);
    clearAuthSession();
    window.location.assign(loginPath);
    throw new Error('Oturum suresi doldu');
  }

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorMessage(response.status, errorText));
  }

  // if response is 204 No Content, return null or empty object
  if (response.status === 204) return null as T;

  return response.json();
}

export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) => request<T>(endpoint, { ...options, method: 'GET' }),
  post: <T>(endpoint: string, data?: unknown, options?: RequestOptions) => request<T>(endpoint, { ...options, method: 'POST', body: data ? JSON.stringify(data) : undefined }),
  put: <T>(endpoint: string, data?: unknown, options?: RequestOptions) => request<T>(endpoint, { ...options, method: 'PUT', body: data ? JSON.stringify(data) : undefined }),
  delete: <T>(endpoint: string, options?: RequestOptions) => request<T>(endpoint, { ...options, method: 'DELETE' }),
  upload: <T = UploadResponse>(endpoint: string, formData: FormData, options?: RequestOptions) =>
    request<T>(endpoint, { ...options, method: 'POST', body: formData }),
};

export async function downloadProtectedFile(path: string): Promise<Blob> {
  const headers = new Headers();
  headers.set('ngrok-skip-browser-warning', 'true');

  const token = getStoredAccessToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(resolveUrl(path), { headers });
  if (response.status === 401) {
    const loginPath = getAuthLoginPath(useAuthStore.getState().role);
    clearAuthSession();
    window.location.assign(loginPath);
    throw new Error('Oturum suresi doldu');
  }
  if (!response.ok) {
    throw new Error(errorMessage(response.status, await response.text()));
  }
  return response.blob();
}

function resolveUrl(endpoint: string) {
  if (/^https?:\/\//i.test(endpoint)) {
    return endpoint;
  }
  if (
    endpoint.startsWith('/uploads/') &&
    !endpoint.endsWith('/ticket-media') &&
    !endpoint.endsWith('/provider-documents') &&
    !endpoint.endsWith('/profile-logo')
  ) {
    return `${API_ROOT_URL}${endpoint}`;
  }
  return `${BASE_URL}${endpoint}`;
}

function errorMessage(status: number, rawBody: string) {
  try {
    const parsed = JSON.parse(rawBody) as { detail?: string; title?: string; reason?: string };
    const message = parsed.detail || parsed.reason || parsed.title || `API Error: ${status}`;
    return friendlyErrorMessage(message, status);
  } catch {
    return friendlyErrorMessage(rawBody || `API Error: ${status}`, status);
  }
}

function friendlyErrorMessage(message: string, status: number) {
  const normalized = message.trim();
  const knownMessages: Record<string, string> = {
    'Service provider is not verified':
      'Servis hesabınız operasyon onayı bekliyor. Onay tamamlandığında iş listesi açılacak.',
    'Provider must upload at least one document before approval':
      'Servis sağlayıcı onayı için en az bir belge yüklenmelidir.',
    'All provider documents must be verified before approval':
      'Servis sağlayıcı onaylanmadan önce tüm belgeler doğrulanmalıdır.',
    'Provider email is already registered':
      'Bu e-posta ile kayıtlı bir servis sağlayıcı zaten var.',
    'Asset tag number is already registered':
      'Bu tag numarası başka bir varlıkta kullanılıyor.',
    'E-posta veya şifre hatalı':
      'E-posta veya şifre hatalı. Bilgileri kontrol edip tekrar deneyin.',
    'Access Denied':
      'Bu işlem için yetkiniz yok.',
    Forbidden:
      'Bu işlem için yetkiniz yok.',
  };

  if (knownMessages[normalized]) {
    return knownMessages[normalized];
  }
  if (normalized.startsWith('API Error:')) {
    return `İşlem tamamlanamadı. API yanıtı: ${status}`;
  }
  if (status === 403) {
    return 'Bu işlem için yetkiniz yok.';
  }
  if (status === 404) {
    return 'İstenen kayıt ya da dosya bulunamadı.';
  }
  if (status === 405) {
    return 'API adresi yanlış görünüyor. VITE_API_URL /api ile bitmeli.';
  }
  return normalized;
}

function networkErrorMessage() {
  return 'Backend bağlantısı kurulamadı. API adresini ve sunucu erişimini kontrol edin.';
}
