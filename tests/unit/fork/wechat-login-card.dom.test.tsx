// FORK-CUSTOM: fork-only DOM coverage for the XAIWork WeChat login card.

import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('@/renderer/hooks/context/AuthContext', () => ({
  useAuth: () => ({ refresh: vi.fn() }),
}));

vi.mock('@/renderer/hooks/useWechatLogin', () => ({
  useWechatLogin: () => ({
    status: 'waiting',
    mode: 'miniprogram',
    qrCodeUrl: null,
    qrContent: 'https://example.com/login',
    errorText: null,
    start: vi.fn(),
  }),
}));

import WechatLoginCard from '@/renderer/pages/login/WechatLoginCard';

describe('XAIWork WeChat login card', () => {
  it('keeps the waiting state focused on the QR code and agreement', () => {
    const { container } = render(<WechatLoginCard />);

    const panel = container.querySelector('.login-page__wechat-panel');
    const agreement = container.querySelector('.login-page__agreement');

    expect(panel).toContainElement(agreement);
    expect(agreement).toHaveTextContent('xaiwork.wechat.agreementPrefixxaiwork.wechat.agreementName');
    expect(screen.queryByText('xaiwork.wechat.waiting')).toBeNull();
    expect(screen.queryByText('xaiwork.wechat.tip')).toBeNull();
    expect(container.querySelector('.login-page__wechat-dots')).toBeNull();
  });
});
