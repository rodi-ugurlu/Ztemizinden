import { clearAuthSession, getStoredAccessToken } from '@/store/useAuthStore';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

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
  let url = `${BASE_URL}${endpoint}`;
  
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

  const response = await fetch(url, config);

  if (response.status === 401) {
    clearAuthSession();
    window.location.assign('/');
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

function errorMessage(status: number, rawBody: string) {
  try {
    const parsed = JSON.parse(rawBody) as { detail?: string; title?: string; reason?: string };
    return parsed.detail || parsed.reason || parsed.title || `API Error: ${status}`;
  } catch {
    return rawBody || `API Error: ${status}`;
  }
}
