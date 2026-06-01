const DEFAULT_API_BASE_URL = '/api';

export function getApiBaseUrl() {
  return normalizeApiBaseUrl(import.meta.env.VITE_API_URL || DEFAULT_API_BASE_URL);
}

export function getApiRootUrl() {
  return getApiBaseUrl().replace(/\/api\/?$/, '');
}

export function normalizeApiBaseUrl(value: string) {
  const trimmed = value.trim().replace(/\/+$/, '');
  if (!trimmed) {
    return DEFAULT_API_BASE_URL;
  }
  return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
}
