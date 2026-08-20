const API_BASE = import.meta.env.VITE_API_BASE_URL || '';

export type WebSession = {
  session: { id: string; userId: string; expiresAt: string };
  user: {
    id: string;
    email: string;
    name: string;
    username?: string | null;
    displayUsername?: string | null;
    image?: string | null;
  };
};

type AuthErrorBody = {
  code?: string;
  message?: string;
  error?: { code?: string; message?: string } | string;
};

function authError(body: AuthErrorBody | null, status: number) {
  const nested = typeof body?.error === 'object' ? body.error : null;
  const message = nested?.message || body?.message || (typeof body?.error === 'string' ? body.error : '');
  return new Error(message || `Authentication request failed (${status})`);
}

async function authRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE}/api/auth${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      'content-type': 'application/json',
      ...(init.headers || {}),
    },
  });

  const contentType = response.headers.get('content-type') || '';
  const body = contentType.includes('application/json')
    ? ((await response.json()) as T | AuthErrorBody | null)
    : null;

  if (!response.ok) throw authError(body as AuthErrorBody | null, response.status);
  return body as T;
}

export function getWebSession() {
  return authRequest<WebSession | null>('/get-session', { method: 'GET' });
}

export function signInWeb(identifier: string, password: string) {
  const isEmail = identifier.includes('@');
  return authRequest<unknown>(isEmail ? '/sign-in/email' : '/sign-in/username', {
    method: 'POST',
    body: JSON.stringify(
      isEmail
        ? { email: identifier.trim().toLowerCase(), password, rememberMe: true }
        : { username: identifier.trim(), password, rememberMe: true },
    ),
  });
}

export function signUpWeb(email: string, username: string, password: string) {
  const displayUsername = username.trim();
  return authRequest<unknown>('/sign-up/email', {
    method: 'POST',
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      password,
      name: displayUsername,
      username: displayUsername,
      displayUsername,
    }),
  });
}

export function signOutWeb() {
  return authRequest<unknown>('/sign-out', { method: 'POST', body: '{}' });
}
