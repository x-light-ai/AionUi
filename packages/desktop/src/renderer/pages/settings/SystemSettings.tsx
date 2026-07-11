/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { useLocation } from 'react-router-dom';
import SystemModalContent from '@/renderer/components/settings/SettingsModal/contents/SystemModalContent';
// FORK-CUSTOM: 关于页渲染入口指向 fork 组件（上游 AboutModalContent.tsx 保持原样）
import AboutModalContent from '@/renderer/components/settings/SettingsModal/contents/XaiworkAboutModalContent';
import SettingsPageWrapper from './components/SettingsPageWrapper';

const SystemSettings: React.FC = () => {
  const location = useLocation();
  const isAboutPage = location.pathname === '/settings/about';

  return (
    <SettingsPageWrapper contentClassName={isAboutPage ? 'max-w-640px' : undefined}>
      {isAboutPage ? <AboutModalContent /> : <SystemModalContent />}
    </SettingsPageWrapper>
  );
};

export default SystemSettings;
