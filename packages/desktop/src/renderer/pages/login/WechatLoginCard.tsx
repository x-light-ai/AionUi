// FORK-CUSTOM: WeChat (XAIWork) QR login card rendered on the login page.
//
// Self-contained component so the upstream login page only needs a one-line
// render. Style matches the existing login page (plain elements + login-page__*
// classes) rather than the Arco convention used elsewhere in the app.

import React, { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../../hooks/context/AuthContext';
import { useWechatLogin } from '../../hooks/useWechatLogin';

const WechatLoginCard: React.FC = () => {
  const { t } = useTranslation();
  const { refresh } = useAuth();
  const navigate = useNavigate();
  // Once login is confirmed, never re-fetch a QR code. A confirmed login briefly
  // re-validates the session cookie via refresh(); without this guard a remount
  // would call start() again and spawn a fresh (unscanned -> pending) QR code.
  const confirmedRef = useRef(false);
  const { status, mode, qrCodeUrl, qrContent, errorText, start } = useWechatLogin(() => {
    confirmedRef.current = true;
    // Re-validate the freshly set session cookie, then navigate to a clean
    // route. A stale `?xaiwork=expired` on the login URL keeps the route guards
    // from redirecting even once authenticated, so go to /guid explicitly
    // (after refresh resolves) to drop the expired flag and enter the app.
    void refresh({ silent: true }).then(() => {
      navigate('/guid', { replace: true });
    });
  });

  useEffect(() => {
    if (confirmedRef.current) return;
    void start();
  }, [start]);

  const hint = (() => {
    switch (status) {
      case 'loading':
        return t('xaiwork.wechat.loading');
      case 'waiting':
        return t('xaiwork.wechat.waiting');
      case 'confirmed':
        return t('xaiwork.wechat.confirmed');
      case 'expired':
        return t('xaiwork.wechat.expired');
      case 'error':
        return errorText ?? t('xaiwork.wechat.error');
      default:
        return '';
    }
  })();

  // Title tracks status: show "generating" only while the QR is being fetched,
  // then fall back to the stable login title once it (or an error) is ready.
  const title = status === 'loading' || status === 'idle' ? t('xaiwork.wechat.generating') : t('xaiwork.wechat.title');

  const showOverlay = status === 'expired' || status === 'error';

  return (
    <div className='login-page__wechat' aria-label={t('xaiwork.wechat.title')}>
      <div className='login-page__wechat-panel'>
        <div className='login-page__wechat-qr-shell'>
          {(status === 'loading' || status === 'idle') && (
            <div className='login-page__wechat-loading' aria-hidden='true'>
              <span />
            </div>
          )}

          {/* sa 模式:后端返回可显示的二维码图片地址,直接展示 */}
          {mode === 'sa' && qrCodeUrl && status !== 'loading' && status !== 'idle' && (
            <img
              className='login-page__wechat-qr-image'
              src={qrCodeUrl}
              alt={t('xaiwork.wechat.title')}
              width={212}
              height={212}
            />
          )}

          {/* miniprogram 模式:后端只返回二维码内容文本,前端自行生成二维码 */}
          {mode === 'miniprogram' && qrContent && status !== 'loading' && status !== 'idle' && (
            <QRCodeSVG className='login-page__wechat-qr-image' value={qrContent} size={212} />
          )}

          {showOverlay && (
            <div className='login-page__wechat-overlay'>
              <span className='login-page__wechat-overlay-text'>{hint}</span>
              <button type='button' className='login-page__wechat-refresh' onClick={() => void start()}>
                {t('xaiwork.wechat.refresh')}
              </button>
            </div>
          )}
        </div>

        <p className='login-page__wechat-title'>{title}</p>
        {hint && !showOverlay && status !== 'waiting' && (
          <p className='login-page__wechat-hint' role='status' aria-live='polite'>
            {hint}
          </p>
        )}
        <p className='login-page__agreement'>
          {t('xaiwork.wechat.agreementPrefix')}
          <span>{t('xaiwork.wechat.agreementName')}</span>
        </p>
      </div>
    </div>
  );
};

export default WechatLoginCard;
