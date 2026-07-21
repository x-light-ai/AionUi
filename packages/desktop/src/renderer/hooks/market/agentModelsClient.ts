// FORK-CUSTOM: XAIWork agent model client. Routes through AionCore's
// /api/agents/xaiwork/* endpoints — the renderer never talks to XAIWork
// OpenApi directly, so credentials (api_key / config_json) stay server-side.

import { xaiworkBridge } from '@/common/adapter/xaiworkBridge';

/**
 * One distributed model as surfaced to the renderer.
 * Deliberately minimal: no baseUrl, no apiKey, no configJson.
 */
export interface XaiworkAgentModel {
  modelId: string;
  name: string;
  reasoningEfforts: string[];
}

export function createAgentModelsClient(authToken: string) {
  return {
    /** Fetch public model identity + reasoning capabilities for a builtin agent backend. */
    listModels(backend: string): Promise<XaiworkAgentModel[]> {
      return xaiworkBridge.agents.listModels.invoke({
        backend,
        xaiworkAuthToken: authToken,
      });
    },
  };
}
