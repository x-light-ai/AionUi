// FORK-CUSTOM: XAIWork login page — WeChat QR login replaces upstream username/password form.
// Upstream pages/login/index.tsx is kept pristine (upstream island); Router lazy-imports this file instead.
// FORK-CUSTOM: 登录页 logo 用 fork 品牌图（上游 assets/logos/brand/app.png 保持原样）
import loginLogo from '@renderer/assets/logos/brand/xaiwork-app.png';
import React, { useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
// FORK-CUSTOM: 品牌名集中取自 xaiworkBrand.ts，不再依赖 login.json 的 brand/pageTitle
import { XAIWORK_BRAND } from '@/common/config/xaiworkBrand';
import { changeLanguage } from '@/renderer/services/i18n';
import { useLocation, useNavigate } from 'react-router-dom';
import AppLoader from '@renderer/components/layout/AppLoader';
import { useAuth } from '../../hooks/context/AuthContext';
import WechatLoginCard from './WechatLoginCard'; // FORK-CUSTOM: WeChat QR login
import './LoginPage.css';

const LoginPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { status } = useAuth();
  const forceXaiworkLogin = new URLSearchParams(location.search).get('xaiwork') === 'expired';

  useEffect(() => {
    document.body.classList.add('login-page-active');
    return () => {
      document.body.classList.remove('login-page-active');
    };
  }, []);

  useEffect(() => {
    // FORK-CUSTOM: 窗口标题用品牌名
    document.title = XAIWORK_BRAND.appName;
  }, []);

  useEffect(() => {
    document.documentElement.lang = i18n.language;
  }, [i18n.language]);

  useEffect(() => {
    if (status === 'authenticated' && !forceXaiworkLogin) {
      void navigate('/guid', { replace: true });
    }
  }, [forceXaiworkLogin, navigate, status]);

  const supportedLanguages = useMemo<{ code: string; label: string }[]>(
    () => [
      { code: 'zh-CN', label: '简体中文' },
      { code: 'zh-TW', label: '繁體中文' },
      { code: 'ja-JP', label: '日本語' },
      { code: 'ko-KR', label: '한국어' },
      { code: 'tr-TR', label: 'Türkçe' },
      { code: 'uk-UA', label: 'Українська' },
      { code: 'pt-BR', label: 'Português (BR)' },
      { code: 'de-DE', label: 'Deutsch' },
      { code: 'en-US', label: 'English' },
    ],
    []
  );

  const handleLanguageChange = useCallback((event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextLanguage = event.target.value;
    changeLanguage(nextLanguage).catch((error: Error) => {
      console.error('Failed to change language:', error);
    });
  }, []);

  if (status === 'checking') {
    return <AppLoader />;
  }

  return (
    <div className='login-page'>
      {/* <div className='login-page__background' aria-hidden='true'>
        <div className='login-page__background-circle login-page__background-circle--lg' />
        <div className='login-page__background-circle login-page__background-circle--md' />
        <div className='login-page__background-circle login-page__background-circle--sm' />
      </div> */}

      <div className='login-page__card'>
        <label className='login-page__lang-select-wrapper' htmlFor='lang-select'>
          <select
            id='lang-select'
            className='login-page__lang-select'
            value={i18n.language}
            onChange={handleLanguageChange}
          >
            {supportedLanguages.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.label}
              </option>
            ))}
          </select>
        </label>

        <div className='login-page__header'>
          <div className='login-page__logo'>
            {/* FORK-CUSTOM: 品牌名取自 xaiworkBrand.ts */}
            <img src={loginLogo} alt={XAIWORK_BRAND.appName} />
          </div>
          <h1 className='login-page__title'>{XAIWORK_BRAND.appName}</h1>
          <p className='login-page__subtitle'>{t('login.subtitle')}</p>
        </div>

        {/* FORK-CUSTOM: WeChat public-account QR login is the only login entry. */}
        <WechatLoginCard />
      </div>
    </div>
  );
};

export default LoginPage;
