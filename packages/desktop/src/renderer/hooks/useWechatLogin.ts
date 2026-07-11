// FORK-CUSTOM: WeChat (XAIWork) QR login client logic.
//
// Isolated in its own file to minimise upstream merge conflicts. The login
// page only renders <WechatLoginCard/> and otherwise stays untouched.
//
// Two modes, selected by build-time config `XAIWORK_BRAND.wechatLoginMode`:
//   'sa'          = 公众号(服务号)扫码。后端 SAAuth/qrcode 直接返回可显示的
//                   二维码图片 URL(qrCodeUrl)，前端 <img> 展示；轮询 SAAuth/login/{ticket}。
//   'miniprogram' = 小程序扫码。后端 MiniProgramAuth/qrcode 返回二维码内容文本
//                   (qrContent)，前端自行生成二维码；轮询 MiniProgramAuth/status/{ticket}。
//
// Flow (see doc/aionui-wechat-login-design.md):
//   1. GET XAIWork qrcode -> { ticket, qrCodeUrl } (sa) 或 { ticket, qrContent } (miniprogram)
//   2. Poll local AionCore bridge POST /api/auth/xaiwork/login { ticket, mode }
//        - { status: 'pending' }   -> keep polling
//        - { status: 'confirmed' } -> aionui-session cookie is set; remote
//          tokens are in the body. Persist remote tokens, then let AuthContext
//          refresh pick up the local session.

import { useCallback, useEffect, useRef, useState } from 'react';
import { XAIWORK_BRAND } from '@/common/config/xaiworkBrand';
import { saveXaiworkRemoteAuth, type RemoteAuth } from './xaiworkRemoteAuth';

/** 微信登录模式，取自构建期品牌配置。 */
export type WechatLoginMode = 'sa' | 'miniprogram';

/**
 * 各模式对应的 XAIWork 取二维码端点。SAAuth 与 MiniProgramAuth 是后端拆分后的
 * 两套控制器，路由与返回字段均不同（见文件头说明）。
 */
const QRCODE_ENDPOINT: Record<WechatLoginMode, string> = {
  sa: '/openapi/weixin/SAAuth/qrcode',
  miniprogram: '/openapi/weixin/MiniProgramAuth/qrcode',
};

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
  // sa 模式返回 qrCodeUrl(可直接展示的图片地址)；miniprogram 模式返回 qrContent(需前端生成二维码的文本)。
  data?: { ticket?: string; qrCodeUrl?: string; qrContent?: string };
  ticket?: string;
  qrCodeUrl?: string;
  qrContent?: string;
};

/** 解析结果：qrCodeUrl(sa 图片地址) 与 qrContent(miniprogram 二维码内容) 二选一。 */
type ParsedQrCode = { ticket: string; qrCodeUrl: string | null; qrContent: string | null };

type BridgeResponse = {
  success: boolean;
  status: 'pending' | 'expired' | 'confirmed';
  token?: string;
  user?: { id: string; username: string };
  remote_auth?: { access_token: string; refresh_token: string; access_expires_in: number };
  remote_nickname?: string;
};

function readQrCode(json: QrCodeResponse, mode: WechatLoginMode): ParsedQrCode | null {
  const ticket = json.data?.ticket ?? json.ticket;
  if (!ticket) return null;

  if (mode === 'miniprogram') {
    const qrContent = json.data?.qrContent ?? json.qrContent;
    if (!qrContent) return null;
    return { ticket, qrCodeUrl: null, qrContent };
  }

  const qrCodeUrl = json.data?.qrCodeUrl ?? json.qrCodeUrl;
  if (!qrCodeUrl) return null;
  return { ticket, qrCodeUrl, qrContent: null };
}

/**
 * Drive the WeChat QR login. `onConfirmed` is called once the local session
 * cookie is set; the caller should trigger AuthContext.refresh().
 */
export function useWechatLogin(onConfirmed: () => void) {
  const mode: WechatLoginMode = XAIWORK_BRAND.wechatLoginMode;

  const [status, setStatus] = useState<WechatLoginStatus>('idle');
  // sa 模式:后端返回的图片地址,直接 <img src>。
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  // miniprogram 模式:二维码内容文本,由卡片用 QRCodeSVG 自行生成图片。
  const [qrContent, setQrContent] = useState<string | null>(null);
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
        // 带上 mode,桥接据此选择轮询 SAAuth/login 还是 MiniProgramAuth/status。
        body: JSON.stringify({ ticket, mode }),
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
  }, [clearTimers, mode]);

  const start = useCallback(async (): Promise<void> => {
    clearTimers();
    setErrorText(null);
    setQrCodeUrl(null);
    setQrContent(null);
    setStatus('loading');

    try {
      // FORK-CUSTOM: 带上 app 来源编码，XAIWork 据此为会员建立会员-app 关联
      const res = await fetch(
        `${xaiworkBaseUrl()}${QRCODE_ENDPOINT[mode]}?app=${encodeURIComponent(XAIWORK_BRAND.wechatAppCode)}`,
        {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        }
      );
      if (!res.ok) throw new Error(`qrcode status ${res.status}`);

      const parsed = readQrCode((await res.json()) as QrCodeResponse, mode);
      if (!parsed) throw new Error('invalid qrcode response');

      ticketRef.current = parsed.ticket;
      setQrCodeUrl(parsed.qrCodeUrl);
      setQrContent(parsed.qrContent);
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
  }, [clearTimers, poll, mode]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  return { status, mode, qrCodeUrl, qrContent, errorText, start };
}
