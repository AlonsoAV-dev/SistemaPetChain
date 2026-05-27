const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'https://sistema-pet-chain-lh4h.vercel.app/api/v1';
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

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.error?.message ?? 'No se pudo completar la solicitud.');
  }

  return payload?.data ?? payload;
}

