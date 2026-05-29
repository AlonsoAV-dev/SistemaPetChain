function resolveApiBaseUrl() {
  const explicitApiUrl = import.meta.env.VITE_API_URL?.trim();
  if (explicitApiUrl) {
    return explicitApiUrl.replace(/\/+$/, '');
  }

  if (import.meta.env.DEV) {
    return 'http://localhost:3000/api/v1';
  }

  if (typeof window !== 'undefined') {
    return `${window.location.origin}/api/v1`;
  }

  return '/api/v1';
}

const API_BASE_URL = resolveApiBaseUrl();
const SESSION_KEY = 'vetchain_session';

export function getStoredSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY)) ?? null;
  } catch {
    return null;
  }
}

export function saveSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function updateSessionUser(user) {
  const session = getStoredSession();
  if (!session) return;
  saveSession({ ...session, user });
}

export function clearSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function getAuthToken() {
  return getStoredSession()?.token ?? null;
}

export async function apiRequest(path, options = {}) {
  const token = getAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers ?? {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error('No se pudo conectar con el backend. Verifica VITE_API_URL y CORS en producción.');
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error?.message ?? 'No se pudo completar la solicitud.');
  }

  return payload?.data ?? payload;
}
