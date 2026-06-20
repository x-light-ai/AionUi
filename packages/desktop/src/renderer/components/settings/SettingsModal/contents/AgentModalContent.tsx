/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { Message, Switch, Typography } from '@arco-design/web-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import LocalAgents from '@/renderer/pages/settings/AgentSettings/LocalAgents';
import AionScrollArea from '@/renderer/components/base/AionScrollArea';
import { useSettingsViewMode } from '../settingsViewContext';
import { useConfig } from '@/renderer/hooks/config/useConfig';

const AgentModalContent: React.FC = () => {
  const { t } = useTranslation();
  const [, agentMessageContext] = Message.useMessage({ maxCount: 10 });
  const viewMode = useSettingsViewMode();
  const isPageMode = viewMode === 'page';
  const [agentSelectorEnabled, setAgentSelectorEnabled] = useConfig('ui.agentSelectorEnabled');

  return (
    <div className='flex flex-col h-full w-full'>
      {agentMessageContext}

      <AionScrollArea className='flex-1 min-h-0 pb-16px scrollbar-hide' disableOverflow={isPageMode}>
        <div className='space-y-16px'>
          <div className='px-16px md:px-24px lg:px-28px py-14px md:py-16px bg-2 rd-16px'>
            <div className='flex items-center justify-between gap-12px'>
              <div>
                <Typography.Text className='text-14px font-medium text-t-primary block'>
                  {t('settings.agentSelectorEnable')}
                </Typography.Text>
                <Typography.Text className='text-12px text-t-secondary block mt-2px'>
                  {t('settings.agentSelectorEnableDesc')}
                </Typography.Text>
              </div>
              <Switch checked={agentSelectorEnabled ?? false} onChange={(val) => void setAgentSelectorEnabled(val)} />
            </div>
          </div>

          <LocalAgents agentSelectorEnabled={agentSelectorEnabled ?? false} />
        </div>
      </AionScrollArea>
    </div>
  );
};

export default AgentModalContent;
