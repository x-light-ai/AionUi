// FORK-CUSTOM: WeChat (XAIWork) QR login card rendered on the login page.
//
// Self-contained component so the upstream login page only needs a one-line
// render. Style matches the existing login page (plain elements + login-page__*
// classes) rather than the Arco convention used elsewhere in the app.

import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/context/AuthContext';
import { useWechatLogin } from '../../hooks/useWechatLogin';

const WechatLoginCard: React.FC = () => {
  const { t } = useTranslation();
  const { refresh } = useAuth();
  const { status, qrCodeUrl, errorText, start } = useWechatLogin(() => {
    void refresh();
  });

  useEffect(() => {
    void start();
  }, [start]);

  const hint = (() => {
    switch (status) {
      case 'loading':
        return t('login.wechat.loading');
      case 'waiting':
        return t('login.wechat.waiting');
      case 'confirmed':
        return t('login.wechat.confirmed');
      case 'expired':
        return t('login.wechat.expired');
      case 'error':
        return errorText ?? t('login.wechat.error');
      default:
        return '';
    }
  })();

  const showOverlay = status === 'expired' || status === 'error';

  return (
    <div className='login-page__wechat' aria-label={t('login.wechat.title')}>
      <div className='login-page__wechat-panel'>
        <div className='login-page__wechat-qr-shell'>
          {(status === 'loading' || status === 'idle') && (
            <div className='login-page__wechat-loading' aria-hidden='true'>
              <span />
            </div>
          )}

          {qrCodeUrl && status !== 'loading' && status !== 'idle' && (
            <img
              className='login-page__wechat-qr-image'
              src={qrCodeUrl}
              alt={t('login.wechat.title')}
              width={212}
              height={212}
            />
          )}

          {showOverlay && (
            <div className='login-page__wechat-overlay'>
              <span className='login-page__wechat-overlay-text'>{hint}</span>
              <button type='button' className='login-page__wechat-refresh' onClick={() => void start()}>
                {t('login.wechat.refresh')}
              </button>
            </div>
          )}
        </div>

        <p className='login-page__wechat-title'>{t('login.wechat.generating')}</p>
        {hint && !showOverlay && (
          <p className='login-page__wechat-hint' role='status' aria-live='polite'>
            {hint}
          </p>
        )}
        <div className='login-page__wechat-dots' aria-hidden='true'>
          <span />
          <span />
          <span />
        </div>
      </div>

      <p className='login-page__wechat-tip'>{t('login.wechat.tip')}</p>
      <p className='login-page__agreement'>
        {t('login.wechat.agreementPrefix')}
        <span>{t('login.wechat.agreementName')}</span>
      </p>
    </div>
  );
};

export default WechatLoginCard;
