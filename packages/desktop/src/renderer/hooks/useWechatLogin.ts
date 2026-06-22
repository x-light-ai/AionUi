// FORK-CUSTOM: WeChat (XAIWork) QR login client logic.
//
// Isolated in its own file to minimise upstream merge conflicts. The login
// page only renders <WechatLoginCard/> and otherwise stays untouched.
//
// Flow (see doc/aionui-wechat-login-design.md):
//   1. GET XAIWork qrcode -> { ticket, qrCodeUrl }
//   2. Poll local AionCore bridge POST /api/auth/xaiwork/login { ticket }
//        - { status: 'pending' }   -> keep polling
//        - { status: 'confirmed' } -> aionui-session cookie is set; remote
//          tokens are in the body. Persist remote tokens, then let AuthContext
//          refresh pick up the local session.

import { useCallback, useEffect, useRef, useState } from 'react';
import { FORK_BRAND } from '@/common/config/forkBrand';
import { saveXaiworkRemoteAuth, type RemoteAuth } from './xaiworkRemoteAuth';

/**
 * Where XAIWork OpenAPI is reachable from the renderer.
 *
 * Default: same-origin (empty prefix) so requests go to `/openapi/...` and can
 * be reverse-proxied to XAIWork by the deployment. To point at a standalone
 * XAIWork host, set `window.__XAIWORK_BASE_URL__` at runtime.
 */
function xaiworkBaseUrl(): string {
  const injected = (globalThis as { __XAIWORK_BASE_URL__?: string }).__XAIWORK_BASE_URL__;
  return (injected ?? '').replace(/\/+$/, '');
}

/** Poll interval / lifetime. XAIWork QR sessions expire after ~10 min. */
const POLL_INTERVAL_MS = 2000;
const QR_LIFETIME_MS = 5 * 60 * 1000;

export type WechatLoginStatus = 'idle' | 'loading' | 'waiting' | 'confirmed' | 'expired' | 'error';

type QrCodeResponse = {
  // XHub wraps payloads as { success, data, ... } with camelCase keys.
  data?: { ticket?: string; qrCodeUrl?: string };
  ticket?: string;
  qrCodeUrl?: string;
};

type BridgeResponse = {
  success: boolean;
  status: 'pending' | 'expired' | 'confirmed';
  token?: string;
  user?: { id: string; username: string };
  remote_auth?: { access_token: string; refresh_token: string; access_expires_in: number };
  remote_nickname?: string;
};

function readQrCode(json: QrCodeResponse): { ticket: string; qrCodeUrl: string } | null {
  const ticket = json.data?.ticket ?? json.ticket;
  const qrCodeUrl = json.data?.qrCodeUrl ?? json.qrCodeUrl;
  if (!ticket || !qrCodeUrl) return null;
  return { ticket, qrCodeUrl };
}

/**
 * Drive the WeChat QR login. `onConfirmed` is called once the local session
 * cookie is set; the caller should trigger AuthContext.refresh().
 */
export function useWechatLogin(onConfirmed: () => void) {
  const [status, setStatus] = useState<WechatLoginStatus>('idle');
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  const ticketRef = useRef<string | null>(null);
  const pollTimer = useRef<number | undefined>(undefined);
  const expireTimer = useRef<number | undefined>(undefined);
  const onConfirmedRef = useRef(onConfirmed);
  onConfirmedRef.current = onConfirmed;

  const clearTimers = useCallback(() => {
    if (pollTimer.current) window.clearTimeout(pollTimer.current);
    if (expireTimer.current) window.clearTimeout(expireTimer.current);
    pollTimer.current = undefined;
    expireTimer.current = undefined;
  }, []);

  const poll = useCallback(async (): Promise<void> => {
    const ticket = ticketRef.current;
    if (!ticket) return;

    try {
      // Same-origin: web-host/static-server proxies /api/* to AionCore.
      const res = await fetch('/api/auth/xaiwork/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ ticket }),
      });

      if (!res.ok) {
        // 502/503 etc. — transient; keep polling unless expired.
        pollTimer.current = window.setTimeout((): void => void poll(), POLL_INTERVAL_MS);
        return;
      }

      const data = (await res.json()) as BridgeResponse;

      if (data.status === 'confirmed') {
        clearTimers();
        if (data.remote_auth) {
          const remote: RemoteAuth = {
            accessToken: data.remote_auth.access_token,
            refreshToken: data.remote_auth.refresh_token,
            accessExpiresIn: data.remote_auth.access_expires_in,
          };
          try {
            saveXaiworkRemoteAuth(remote);
          } catch (e) {
            console.warn('Failed to persist remote auth:', e);
          }
        }
        setStatus('confirmed');
        onConfirmedRef.current();
        return;
      }

      if (data.status === 'expired') {
        // XAIWork ticket is gone (expired/unknown): stop polling and prompt a refresh.
        clearTimers();
        setStatus('expired');
        return;
      }

      // pending -> keep polling
      setStatus('waiting');
      pollTimer.current = window.setTimeout((): void => void poll(), POLL_INTERVAL_MS);
    } catch (e) {
      console.error('XAIWork login poll failed:', e);
      pollTimer.current = window.setTimeout((): void => void poll(), POLL_INTERVAL_MS);
    }
  }, [clearTimers]);

  const start = useCallback(async (): Promise<void> => {
    clearTimers();
    setErrorText(null);
    setQrCodeUrl(null);
    setStatus('loading');

    try {
      // FORK-CUSTOM: 带上 app 来源编码，XAIWork 据此为会员建立会员-app 关联
      const res = await fetch(`${xaiworkBaseUrl()}/openapi/WeixinAuth/qrcode?app=${encodeURIComponent(FORK_BRAND.wechatAppCode)}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error(`qrcode status ${res.status}`);

      const parsed = readQrCode((await res.json()) as QrCodeResponse);
      if (!parsed) throw new Error('invalid qrcode response');

      ticketRef.current = parsed.ticket;
      setQrCodeUrl(parsed.qrCodeUrl);
      setStatus('waiting');

      expireTimer.current = window.setTimeout(() => {
        clearTimers();
        setStatus('expired');
      }, QR_LIFETIME_MS);

      pollTimer.current = window.setTimeout((): void => void poll(), POLL_INTERVAL_MS);
    } catch (e) {
      console.error('Failed to start WeChat login:', e);
      setStatus('error');
      setErrorText((e as Error).message);
    }
  }, [clearTimers, poll]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  return { status, qrCodeUrl, errorText, start };
}
