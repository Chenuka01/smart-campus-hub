import type { AuthResponse } from '@/lib/types';

const AUTH_TOKEN_KEY = 'smartCampus.authToken';
const AUTH_USER_KEY = 'smartCampus.authUser';
const LEGACY_TOKEN_KEY = 'token';
const LEGACY_USER_KEY = 'user';

function migrateLegacyStorage() {
  const namespacedToken = localStorage.getItem(AUTH_TOKEN_KEY);
  const namespacedUser = localStorage.getItem(AUTH_USER_KEY);
  const legacyToken = localStorage.getItem(LEGACY_TOKEN_KEY);
  const legacyUser = localStorage.getItem(LEGACY_USER_KEY);

  if (!namespacedToken && legacyToken) {
    localStorage.setItem(AUTH_TOKEN_KEY, legacyToken);
  }

  if (!namespacedUser && legacyUser) {
    localStorage.setItem(AUTH_USER_KEY, legacyUser);
  }

  if (legacyToken) {
    localStorage.removeItem(LEGACY_TOKEN_KEY);
  }

  if (legacyUser) {
    localStorage.removeItem(LEGACY_USER_KEY);
  }
}

export function getStoredToken() {
  migrateLegacyStorage();
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function getStoredUser() {
  migrateLegacyStorage();
  const rawUser = localStorage.getItem(AUTH_USER_KEY);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser) as AuthResponse;
  } catch {
    clearStoredAuth();
    return null;
  }
}

export function persistAuth(auth: AuthResponse) {
  localStorage.setItem(AUTH_TOKEN_KEY, auth.token);
  localStorage.setItem(AUTH_USER_KEY, JSON.stringify(auth));
  localStorage.removeItem(LEGACY_TOKEN_KEY);
  localStorage.removeItem(LEGACY_USER_KEY);
}

export function clearStoredAuth() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_USER_KEY);
  localStorage.removeItem(LEGACY_TOKEN_KEY);
  localStorage.removeItem(LEGACY_USER_KEY);
}
