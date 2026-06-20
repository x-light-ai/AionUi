// FORK-CUSTOM: shared XAIWork remote auth storage for OpenAPI calls.

export const XAIWORK_REMOTE_AUTH_KEY = 'xaiwork.remoteAuth';
export const XAIWORK_REMOTE_AUTH_EXPIRED_LOGIN = '#/login?xaiwork=expired';

export type RemoteAuth = {
  accessToken: string;
  refreshToken: string;
  accessExpiresIn: number;
};

export function readXaiworkRemoteAuth(): RemoteAuth | null {
  try {
    const raw = localStorage.getItem(XAIWORK_REMOTE_AUTH_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<RemoteAuth>;
    if (!parsed.accessToken) return null;

    return parsed as RemoteAuth;
  } catch {
    return null;
  }
}

export function saveXaiworkRemoteAuth(remote: RemoteAuth): void {
  localStorage.setItem(XAIWORK_REMOTE_AUTH_KEY, JSON.stringify(remote));
}

export function clearXaiworkRemoteAuth(): void {
  localStorage.removeItem(XAIWORK_REMOTE_AUTH_KEY);
}

export function redirectToXaiworkRemoteLogin(): void {
  clearXaiworkRemoteAuth();
  window.location.href = XAIWORK_REMOTE_AUTH_EXPIRED_LOGIN;
}
