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
// When XAIWork has no models for the backend (host unset, not logged in, or
// empty list), this transparently falls back to the upstream useAcpModelInfo
// behaviour.
import type { AcpModelInfo } from '@/common/types/platform/acpTypes';
import { useCallback, useMemo, useState } from 'react';
import { applyXaiworkModelConfig } from '../market/applyXaiworkModelConfig';
import { useAcpModelInfo, type UseAcpModelInfoResult } from './useAcpModelInfo';
import { useXaiworkAgentModels } from './useXaiworkAgentModels';

type UseAcpModelInfoParams = {
  conversation_id: string;
  backend?: string;
  initialModelId?: string;
  prepareRuntime?: () => Promise<void>;
  enabled?: boolean;
  persistGlobalPreference?: boolean;
  onSelectModelSuccess?: (model_id: string) => void;
  onSelectModelFailed?: (model_id: string, error: unknown) => void;
};

export const useAcpModelInfoXaiwork = (params: UseAcpModelInfoParams): UseAcpModelInfoResult => {
  const {
    backend,
    initialModelId,
    enabled = true,
    persistGlobalPreference = true,
    onSelectModelSuccess,
    onSelectModelFailed,
  } = params;

  const base = useAcpModelInfo(params);
  const { byModelId, hasModels } = useXaiworkAgentModels(enabled ? backend : undefined);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);

  // Build the overridden model_info from the XAIWork distribution.
  const xaiworkModelInfo = useMemo<AcpModelInfo | null>(() => {
    if (!hasModels) return null;
    const available = Array.from(byModelId.values()).map((m) => ({ id: m.modelId, label: m.name }));
    // Priority: user's explicit selection → base hook's current (if still valid)
    // → caller's initial preference → first distributed model.
    const baseCurrent = base.model_info?.current_model_id ?? null;
    const current =
      (selectedModelId && byModelId.has(selectedModelId) && selectedModelId) ||
      (baseCurrent && byModelId.has(baseCurrent) && baseCurrent) ||
      (initialModelId && byModelId.has(initialModelId) && initialModelId) ||
      available[0]?.id ||
      null;
    return {
      current_model_id: current,
      current_model_label: (current && byModelId.get(current)?.name) || current,
      available_models: available,
    };
  }, [hasModels, byModelId, selectedModelId, base.model_info?.current_model_id, initialModelId]);

  const selectModelXaiwork = useCallback(
    (model_id: string) => {
      if (!enabled || !backend) return;
      const model = byModelId.get(model_id);
      if (!model) {
        onSelectModelFailed?.(model_id, new Error('model not found in XAIWork distribution'));
        return;
      }
      void (async () => {
        try {
          await applyXaiworkModelConfig(backend, model);
          setSelectedModelId(model_id);
          onSelectModelSuccess?.(model_id);
        } catch (error) {
          onSelectModelFailed?.(model_id, error);
        }
      })();
    },
    [
      enabled,
      backend,
      byModelId,
      persistGlobalPreference,
      setSelectedModelId,
      onSelectModelSuccess,
      onSelectModelFailed,
    ]
  );

  if (!hasModels || !xaiworkModelInfo) {
    return base;
  }

  return {
    ...base,
    model_info: xaiworkModelInfo,
    canSwitch: true,
    selectModel: selectModelXaiwork,
  };
};
