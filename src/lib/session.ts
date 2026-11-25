const TOKEN_KEY = "arin-study-diary-token";
const USER_KEY = "arin-study-diary-user";
const AUTH_COOKIE = "arin_diary_auth";

export interface SessionUser {
  id: string;
  role: "arin" | "emon";
  email: string;
  displayName?: string;
  avatarDataUrl?: string | null;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getSessionUser(): SessionUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as SessionUser) : null;
  } catch {
    return null;
  }
}

export function setSession(token: string, user: SessionUser) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  // Middleware gate (not the JWT — API still uses Bearer token)
  document.cookie = `${AUTH_COOKIE}=1; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax`;
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  document.cookie = `${AUTH_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export function isLoggedIn(): boolean {
  return Boolean(getToken());
}
