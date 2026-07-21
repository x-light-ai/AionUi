// FORK-CUSTOM: inject the XAIWork model lifecycle into the upstream ACP selector.
/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { useAcpModelInfoXaiwork } from '@/renderer/hooks/agent/useAcpModelInfoXaiwork';
import React from 'react';
import { useTranslation } from 'react-i18next';
import AcpModelSelector from '../AcpModelSelector';

type XaiworkAcpModelSelectorProps = Omit<
  React.ComponentProps<typeof AcpModelSelector>,
  'useModelInfo' | 'modelUnavailableTooltip'
>;

const XaiworkAcpModelSelector: React.FC<XaiworkAcpModelSelectorProps> = (props) => {
  const { t } = useTranslation();

  return (
    <AcpModelSelector
      {...props}
      useModelInfo={useAcpModelInfoXaiwork}
      modelUnavailableTooltip={t('settings.noAvailableModels')}
    />
  );
};

export default XaiworkAcpModelSelector;
