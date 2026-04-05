const configuredApiUrl = import.meta.env.VITE_API_URL?.trim();
const fallbackApiUrl = import.meta.env.DEV ? 'http://localhost:8000' : window.location.origin;
const rawApiUrl = configuredApiUrl || fallbackApiUrl;

export const API_BASE_URL = rawApiUrl.replace(/\/+$/, '');

export const buildApiUrl = (path) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};
