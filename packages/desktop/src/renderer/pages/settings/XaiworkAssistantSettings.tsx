// FORK-CUSTOM: fork-only Assistant settings composition.
/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * FORK-CUSTOM: XAIWork 定制版助手设置容器页（替代上游 AssistantSettings 入口）。
 *
 * 上游 AssistantSettings/index.tsx 保持原样不动（成为不被路由引用的孤岛），本文件承载所有
 * fork 改动：新增两个 tab —— "我的助手"（XaiworkMyAssistants，过滤掉 generated 助手）与
 * "助手市场"（AssistantMarketSettings）。路由在 Router.tsx 中指向本组件，避免直接重写上游
 * 文件造成 rebase 冲突。结构与 XaiworkCapabilitiesSettings 一致。
 */

import { Tabs } from '@arco-design/web-react';
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import XaiworkMyAssistants from './XaiworkMyAssistants';
import XaiworkAssistantMarketSettings from './XaiworkAssistantMarketSettings';
import styles from './XaiworkAssistantSettings.module.css';

type AssistantTab = 'mine' | 'market';

const isAssistantTab = (value: string | null): value is AssistantTab => value === 'mine' || value === 'market';

const XaiworkAssistantSettings: React.FC = () => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Local state drives the active tab. The URL `?tab=` param is only read to
  // honor incoming navigation; it is stripped right after so switching tabs
  // never pollutes the address bar (mirrors XaiworkCapabilitiesSettings).
  const [activeTab, setActiveTab] = useState<AssistantTab>(() => {
    const tabParam = searchParams.get('tab');
    return isAssistantTab(tabParam) ? tabParam : 'mine';
  });

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (!tabParam) return;
    if (isAssistantTab(tabParam)) {
      setActiveTab(tabParam);
    }
    const next = new URLSearchParams(searchParams);
    next.delete('tab');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const handleTabChange = (key: string) => {
    if (isAssistantTab(key)) {
      setActiveTab(key);
    }
  };

  return (
    <div className='h-full min-h-0 overflow-y-auto px-16px py-14px md:px-40px md:py-32px'>
      <Tabs
        activeTab={activeTab}
        onChange={handleTabChange}
        type='line'
        animation={{ tabPane: false, inkBar: true }}
        className={`${styles.tabs} [&>.arco-tabs-content]:pt-0`}
      >
        <Tabs.TabPane key='mine' title={t('xaiwork.assistantTab.mine', { defaultValue: '我的助手' })}>
          <XaiworkMyAssistants withWrapper={false} />
        </Tabs.TabPane>
        <Tabs.TabPane key='market' title={t('xaiwork.assistantTab.market', { defaultValue: '助手市场' })}>
          <XaiworkAssistantMarketSettings />
        </Tabs.TabPane>
      </Tabs>
    </div>
  );
};

export default XaiworkAssistantSettings;
