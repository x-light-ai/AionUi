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
      if (!hasModels) return;

      const modelId = selectedModelId || cachedModelId;
      const relayModel = modelId ? byModelId.get(modelId) : undefined;
      const host = XAIWORK_BRAND.apiHost.trim();
      const authToken = readXaiworkRemoteAuth()?.accessToken ?? '';
      if (!relayModel || !backend || !host || !authToken) return;

      try {
        await applyXaiworkModelConfig(backend, relayModel.modelId, host, authToken);
      } catch (error) {
        console.error('Failed to apply XAIWork model config before conversation create:', error);
      }
    },
    [backend, byModelId, hasModels]
  );
}
