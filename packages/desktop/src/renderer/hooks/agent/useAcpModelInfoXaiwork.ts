// FORK-CUSTOM: fork-only ACP model lifecycle backed by XAIWork-distributed models.
/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

// FORK-CUSTOM: Override the ACP model dropdown with XAIWork-distributed
// models. When XAIWork defines models for a builtin agent (claude / codex),
// the dropdown shows ONLY those (replacing the CLI's ACP-handshake list),
// and selecting one applies the model's config (base url / key / model / config_json)
// via AionCore so the next spawned process uses the relay and the model's settings.
//
// When XAIWork has no models for the backend, expose no model instead of
// falling back to the CLI handshake catalog.
import type { AcpModelInfo } from '@/common/types/platform/acpTypes';
import { useCallback, useMemo, useState } from 'react';
import { applyXaiworkModelConfig } from '../market/applyXaiworkModelConfig';
import { readXaiworkRemoteAuth } from '../xaiworkRemoteAuth';
import { useAcpModelInfo, type UseAcpModelInfoResult } from './useAcpModelInfo';
import type { AcpConfigOptionsLoader } from './useAcpConfigOptions';
import { buildXaiworkModelInfo, buildXaiworkThoughtLevelOption, useXaiworkAgentModels } from './useXaiworkAgentModels';

type UseAcpModelInfoParams = {
  conversation_id: string;
  backend?: string;
  initialModelId?: string;
  prepareRuntime?: () => Promise<void>;
  prepareSetRuntime?: () => Promise<void>;
  loadConfigOptions?: AcpConfigOptionsLoader;
  enabled?: boolean;
  onSelectModelSuccess?: (model_id: string) => void;
  onSelectModelFailed?: (model_id: string, error: unknown) => void;
};

export const useAcpModelInfoXaiwork = (params: UseAcpModelInfoParams): UseAcpModelInfoResult => {
  const { backend, initialModelId, enabled = true, onSelectModelSuccess, onSelectModelFailed } = params;

  const base = useAcpModelInfo(params);
  const {
    models,
    byModelId,
    hasModels,
    isLoading: isXaiworkModelsLoading,
  } = useXaiworkAgentModels(enabled ? backend : undefined);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);

  // Build the overridden model_info from the XAIWork distribution.
  // Priority: user's explicit selection → base hook's current (if still valid)
  // → caller's initial preference → first distributed model.
  const baseCurrentModelId = base.model_info?.current_model_id ?? null;
  const xaiworkModelInfo = useMemo<AcpModelInfo | null>(
    () => buildXaiworkModelInfo(models, [selectedModelId, baseCurrentModelId, initialModelId]),
    [models, selectedModelId, baseCurrentModelId, initialModelId]
  );
  const xaiworkThoughtLevel = useMemo(() => {
    const currentModel = xaiworkModelInfo?.current_model_id
      ? byModelId.get(xaiworkModelInfo.current_model_id)
      : undefined;
    return buildXaiworkThoughtLevelOption(currentModel?.reasoningEfforts, base.thoughtLevel ?? undefined);
  }, [base.thoughtLevel, byModelId, xaiworkModelInfo?.current_model_id]);

  const selectModelXaiwork = useCallback(
    (model_id: string) => {
      if (!enabled || !backend) return;
      const model = byModelId.get(model_id);
      if (!model) {
        onSelectModelFailed?.(model_id, new Error('model not found in XAIWork distribution'));
        return;
      }
      const authToken = readXaiworkRemoteAuth()?.accessToken ?? '';
      if (!authToken) {
        onSelectModelFailed?.(model_id, new Error('XAIWork token not configured'));
        return;
      }
      void (async () => {
        try {
          await applyXaiworkModelConfig(backend, model_id, authToken);
          setSelectedModelId(model_id);
          onSelectModelSuccess?.(model_id);
        } catch (error) {
          onSelectModelFailed?.(model_id, error);
        }
      })();
    },
    [enabled, backend, byModelId, setSelectedModelId, onSelectModelSuccess, onSelectModelFailed]
  );

  if (!enabled || !backend) {
    return base;
  }

  if (!hasModels || !xaiworkModelInfo) {
    return {
      ...base,
      model_info: null,
      canSwitch: false,
      isLoading: isXaiworkModelsLoading,
      selectModel: selectModelXaiwork,
      thoughtLevel: null,
    };
  }

  return {
    ...base,
    model_info: xaiworkModelInfo,
    canSwitch: true,
    selectModel: selectModelXaiwork,
    thoughtLevel: xaiworkThoughtLevel,
  };
};
