// FORK-CUSTOM: isolate XAIWork API model catalog states from the upstream Guid selector.
/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { iconColors } from '@/renderer/styles/colors';
import { Button, Tooltip } from '@arco-design/web-react';
import { Brain } from '@icon-park/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import GuidModelSelector from '../components/GuidModelSelector';

type XaiworkGuidModelSelectorProps = React.ComponentProps<typeof GuidModelSelector> & {
  isModelCatalogLoading: boolean;
};

const XaiworkGuidModelSelector: React.FC<XaiworkGuidModelSelectorProps> = ({
  isGeminiMode,
  currentAcpCachedModelInfo,
  isModelCatalogLoading,
  ...props
}) => {
  const { t } = useTranslation();

  if (!isGeminiMode && !currentAcpCachedModelInfo) {
    return (
      <Tooltip content={t(isModelCatalogLoading ? 'common.loading' : 'settings.noAvailableModels')} position='top'>
        <Button
          className='sendbox-model-btn guid-config-btn'
          shape='round'
          size='small'
          loading={isModelCatalogLoading}
          disabled={isModelCatalogLoading}
          data-testid={isModelCatalogLoading ? 'guid-model-selector-loading' : undefined}
          style={isModelCatalogLoading ? undefined : { cursor: 'default' }}
        >
          <span className='flex items-center gap-6px min-w-0'>
            {!isModelCatalogLoading && (
              <Brain theme='outline' size='14' fill={iconColors.secondary} className='shrink-0' />
            )}
            <span className='guid-model-label'>{t('common.defaultModel')}</span>
          </span>
        </Button>
      </Tooltip>
    );
  }

  return (
    <GuidModelSelector {...props} isGeminiMode={isGeminiMode} currentAcpCachedModelInfo={currentAcpCachedModelInfo} />
  );
};

export default XaiworkGuidModelSelector;
