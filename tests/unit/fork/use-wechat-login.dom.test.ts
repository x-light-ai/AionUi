/**
 * FORK-CUSTOM: tests for the XAIWork WeChat QR login hook.
 * @vitest-environment jsdom
 *
 * useWechatLogin drives the XAIWork QR login: it fetches a ticket/qrcode with
 * the fork app-attribution code, polls the local AionCore bridge, and on
 * confirmation persists the remote tokens (snake_case -> camelCase) before
 * handing back to AuthContext.
 */

import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { saveRemoteAuthMock } = vi.hoisted(() => ({ saveRemoteAuthMock: vi.fn() }));

vi.mock('@/renderer/hooks/xaiworkRemoteAuth', () => ({
  saveXaiworkRemoteAuth: (auth: unknown) => saveRemoteAuthMock(auth),
}));

vi.mock('@/common/config/forkBrand', () => ({
  FORK_BRAND: { wechatAppCode: 'xaiwork' },
}));

import { useWechatLogin } from '@renderer/hooks/useWechatLogin';

const jsonResponse = (body: unknown, ok = true) =>
  ({ ok, status: ok ? 200 : 502, json: () => Promise.resolve(body) }) as Response;

describe('renderer/useWechatLogin', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('requests the qrcode with the fork app-attribution code and shows the QR', async () => {
    const fetchSpy = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ data: { ticket: 't-1', qrCodeUrl: 'https://qr/img' } }));
    vi.stubGlobal('fetch', fetchSpy);

    const { result } = renderHook(() => useWechatLogin(vi.fn()));

    await act(async () => {
      await result.current.start();
    });

    const calledUrl = fetchSpy.mock.calls[0][0] as string;
    expect(calledUrl).toContain('/openapi/WeixinAuth/qrcode');
    expect(calledUrl).toContain('app=xaiwork');
    expect(result.current.qrCodeUrl).toBe('https://qr/img');
    expect(result.current.status).toBe('waiting');
  });

  it('sets error status on an invalid qrcode response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(jsonResponse({ data: {} })));

    const { result } = renderHook(() => useWechatLogin(vi.fn()));

    await act(async () => {
      await result.current.start();
    });

    expect(result.current.status).toBe('error');
    expect(result.current.errorText).toBe('invalid qrcode response');
  });

  it('persists remote tokens and calls onConfirmed when the bridge confirms', async () => {
    const onConfirmed = vi.fn();
    const fetchSpy = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ data: { ticket: 't-1', qrCodeUrl: 'https://qr/img' } }))
      .mockResolvedValueOnce(
        jsonResponse({
          success: true,
          status: 'confirmed',
          remote_auth: { access_token: 'a-tok', refresh_token: 'r-tok', access_expires_in: 7200 },
        })
      );
    vi.stubGlobal('fetch', fetchSpy);

    const { result } = renderHook(() => useWechatLogin(onConfirmed));

    await act(async () => {
      await result.current.start();
    });

    // advance to the scheduled poll and flush the bridge response
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    expect(result.current.status).toBe('confirmed');
    expect(saveRemoteAuthMock).toHaveBeenCalledWith({
      accessToken: 'a-tok',
      refreshToken: 'r-tok',
      accessExpiresIn: 7200,
    });
    expect(onConfirmed).toHaveBeenCalledTimes(1);
  });

  it('sets expired status when the bridge reports an expired ticket', async () => {
    const fetchSpy = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ data: { ticket: 't-1', qrCodeUrl: 'https://qr/img' } }))
      .mockResolvedValueOnce(jsonResponse({ success: true, status: 'expired' }));
    vi.stubGlobal('fetch', fetchSpy);

    const { result } = renderHook(() => useWechatLogin(vi.fn()));

    await act(async () => {
      await result.current.start();
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2000);
    });

    expect(result.current.status).toBe('expired');
    expect(saveRemoteAuthMock).not.toHaveBeenCalled();
  });
});
