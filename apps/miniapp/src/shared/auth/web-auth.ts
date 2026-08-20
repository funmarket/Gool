import { http } from '../api/http-client';

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

export function getWebSession() {
  return http<WebSession | null>('/api/auth/get-session', { method: 'GET' });
}

export function signInWeb(identifier: string, password: string) {
  const isEmail = identifier.includes('@');
  return http<unknown>(isEmail ? '/api/auth/sign-in/email' : '/api/auth/sign-in/username', {
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
  return http<unknown>('/api/auth/sign-up/email', {
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
  return http<unknown>('/api/auth/sign-out', { method: 'POST', body: '{}' });
}
