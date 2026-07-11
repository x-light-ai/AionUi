/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * FORK-CUSTOM: XAIWork 定制版 Capabilities 容器页（替代上游 CapabilitiesSettings）。
 *
 * 上游 CapabilitiesSettings.tsx 保持原样不动，本文件承载所有 fork 改动：
 * 新增 "Skill Market" tab，并把 Skills tab 指向 fork 版 XaiworkSkillsSettings。
 * 路由在 Router.tsx 中指向本组件，避免直接重写上游文件造成 rebase 冲突。
 */

import { Tabs } from '@arco-design/web-react';
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import XaiworkSkillsSettings from './XaiworkSkillsSettings';
import XaiworkSkillMarketSettings from './XaiworkSkillMarketSettings';
import SettingsPageWrapper from './components/SettingsPageWrapper';
import styles from './XaiworkCapabilitiesSettings.module.css';

type CapabilitiesTab = 'skills' | 'market';

const isCapabilitiesTab = (value: string | null): value is CapabilitiesTab => value === 'skills' || value === 'market';

const XaiworkCapabilitiesSettings: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Local state drives the active tab. The URL `?tab=` param is only read to
  // honor incoming navigation (e.g. "open Skill Market" from a conversation);
  // it is stripped right after so switching tabs never pollutes the address bar.
  const [activeTab, setActiveTab] = useState<CapabilitiesTab>(() => {
    const tabParam = searchParams.get('tab');
    return isCapabilitiesTab(tabParam) ? tabParam : 'skills';
  });

  // Sync from URL when an external navigation sets `?tab=`, then drop that param
  // while preserving any others (e.g. `highlight` used to scroll to a skill).
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (!tabParam) return;
    if (isCapabilitiesTab(tabParam)) {
      setActiveTab(tabParam);
    }
    const next = new URLSearchParams(searchParams);
    next.delete('tab');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const handleTabChange = (key: string) => {
    if (isCapabilitiesTab(key)) {
      setActiveTab(key);
    }
  };

  return (
    <SettingsPageWrapper contentClassName='max-w-1200px' className='[scrollbar-gutter:stable]'>
      <Tabs
        activeTab={activeTab}
        onChange={handleTabChange}
        type='line'
        animation={{ tabPane: false, inkBar: true }}
        className={`${styles.tabs} flex flex-col flex-1 min-h-0 [&>.arco-tabs-content]:pt-0`}
      >
        <Tabs.TabPane key='skills' title={t('xaiwork.shell.mySkills', { defaultValue: 'My Skills' })}>
          <XaiworkSkillsSettings withWrapper={false} />
        </Tabs.TabPane>
        <Tabs.TabPane key='market' title={t('xaiwork.shell.skillMarket', { defaultValue: 'Skill Market' })}>
          <XaiworkSkillMarketSettings />
        </Tabs.TabPane>
      </Tabs>
    </SettingsPageWrapper>
  );
};

export default XaiworkCapabilitiesSettings;
