const fallbackApiUrl = 'http://localhost:8000';

const rawApiUrl = import.meta.env.VITE_API_URL || fallbackApiUrl;

export const API_BASE_URL = rawApiUrl.replace(/\/+$/, '');

export const buildApiUrl = (path) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};
