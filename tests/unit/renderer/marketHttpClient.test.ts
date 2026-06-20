/**
 * @vitest-environment node
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiError, createApiClient } from '@renderer/hooks/market/httpClient';
import { XAIWORK_REMOTE_AUTH_EXPIRED_LOGIN, XAIWORK_REMOTE_AUTH_KEY } from '@renderer/hooks/xaiworkRemoteAuth';

const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    clear: vi.fn(() => {
      store = {};
    }),
    getItem: vi.fn((key: string) => store[key] ?? null),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
  };
})();

describe('market/httpClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('localStorage', localStorageMock);
    vi.stubGlobal('window', { location: { href: '' } });
    localStorageMock.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('adds XAIWork remote access token to OpenAPI requests', async () => {
    localStorage.setItem(
      XAIWORK_REMOTE_AUTH_KEY,
      JSON.stringify({ accessToken: 'remote-token', refreshToken: 'refresh-token', accessExpiresIn: 7200 })
    );
    const fetchSpy = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    );
    vi.stubGlobal('fetch', fetchSpy);

    const api = createApiClient('http://localhost:5173');
    await api.post('/openapi/market/skill/page', { pageIndex: 1, pageSize: 100 });

    expect(fetchSpy).toHaveBeenCalledWith(
      'http://localhost:5173/openapi/market/skill/page',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer remote-token' }),
      })
    );
  });

  it('does not override caller-provided Authorization', async () => {
    localStorage.setItem(
      XAIWORK_REMOTE_AUTH_KEY,
      JSON.stringify({ accessToken: 'remote-token', refreshToken: 'refresh-token', accessExpiresIn: 7200 })
    );
    const fetchSpy = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchSpy);

    const api = createApiClient('http://localhost:5173');
    await api.get('/openapi/market/skill/page', { headers: { Authorization: 'Bearer caller-token' } });

    expect(fetchSpy).toHaveBeenCalledWith(
      'http://localhost:5173/openapi/market/skill/page',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer caller-token' }),
      })
    );
  });

  it('does not add Authorization when remote access token is missing', async () => {
    const fetchSpy = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchSpy);

    const api = createApiClient('http://localhost:5173');
    await api.post('/openapi/market/skill/page', { pageIndex: 1, pageSize: 100 });

    expect(fetchSpy).toHaveBeenCalledWith(
      'http://localhost:5173/openapi/market/skill/page',
      expect.objectContaining({
        headers: expect.not.objectContaining({ Authorization: expect.any(String) }),
      })
    );
  });

  it('does not add Authorization when stored remote auth is invalid JSON', async () => {
    localStorage.setItem(XAIWORK_REMOTE_AUTH_KEY, '{invalid');
    const fetchSpy = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchSpy);

    const api = createApiClient('http://localhost:5173');
    await api.post('/openapi/market/skill/page', { pageIndex: 1, pageSize: 100 });

    expect(fetchSpy).toHaveBeenCalledWith(
      'http://localhost:5173/openapi/market/skill/page',
      expect.objectContaining({
        headers: expect.not.objectContaining({ Authorization: expect.any(String) }),
      })
    );
  });

  it('clears remote auth and redirects to login when XAIWork returns business token expiry', async () => {
    localStorage.setItem(
      XAIWORK_REMOTE_AUTH_KEY,
      JSON.stringify({ accessToken: 'expired-token', refreshToken: 'refresh-token', accessExpiresIn: 7200 })
    );
    const fetchSpy = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: false, message: '无权限:Token已过期', code: '401.10' }), {
        status: 200,
        statusText: 'OK',
        headers: { 'Content-Type': 'application/json' },
      })
    );
    vi.stubGlobal('fetch', fetchSpy);

    const api = createApiClient('http://localhost:5173');

    await expect(api.post('/openapi/market/skill/page', { pageIndex: 1, pageSize: 100 })).rejects.toBeInstanceOf(
      ApiError
    );
    expect(localStorage.removeItem).toHaveBeenCalledWith(XAIWORK_REMOTE_AUTH_KEY);
    expect(window.location.href).toBe(XAIWORK_REMOTE_AUTH_EXPIRED_LOGIN);
  });
});
