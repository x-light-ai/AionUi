// FORK-CUSTOM: apply a distributed model before creating a conversation.
import { XAIWORK_BRAND } from '@/common/config/xaiworkBrand';
import { useXaiworkAgentModels } from '@/renderer/hooks/agent/useXaiworkAgentModels';
import { applyXaiworkModelConfig } from '@/renderer/hooks/market/applyXaiworkModelConfig';
import { readXaiworkRemoteAuth } from '@/renderer/hooks/xaiworkRemoteAuth';
import { useCallback } from 'react';

export function useXaiworkCreateGuard(backend: string) {
  const { byModelId, hasModels } = useXaiworkAgentModels(backend || undefined);

  return useCallback(
    async (selectedModelId: string | null, cachedModelId?: string): Promise<void> => {
      if (!hasModels) {
        throw new Error(`No XAIWork models available for backend '${backend}'`);
      }

      const modelId = selectedModelId || cachedModelId;
      const relayModel = modelId ? byModelId.get(modelId) : undefined;
      if (!modelId || !relayModel) {
        throw new Error(`Model '${modelId ?? ''}' is not available from XAIWork for backend '${backend}'`);
      }
      const host = XAIWORK_BRAND.apiHost.trim();
      const authToken = readXaiworkRemoteAuth()?.accessToken ?? '';
      if (!backend || !host || !authToken) {
        throw new Error('XAIWork host/token not configured');
      }

      await applyXaiworkModelConfig(backend, relayModel.modelId, host, authToken);
    },
    [backend, byModelId, hasModels]
  );
}
