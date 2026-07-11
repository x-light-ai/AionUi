// FORK-CUSTOM: XAIWork-only HTTP adapters kept outside the upstream IPC bridge.
import type { ImportAssistantsResult } from '../types/agent/assistantTypes';
import { httpGet, httpPost } from './httpBridge';

export type XaiworkInstalledSkillMetadata = {
  name: string;
  description: string | null;
  version: string | null;
  tags: string[];
  source: 'market' | 'assistant-bundle';
  visibility: 'user' | 'dependency';
  assistant_ids: string[];
};

export const xaiworkBridge = {
  assistants: {
    importRemote: httpPost<ImportAssistantsResult, { url: string }>('/api/assistants/import-remote'),
  },
  skills: {
    listMetadata: httpGet<XaiworkInstalledSkillMetadata[], void>('/api/xaiwork/skills/metadata'),
    importWithSymlink: httpPost<{ skill_name: string; skill_names?: string[] }, { skill_path: string }>(
      '/api/skills/import-symlink'
    ),
    importRemote: httpPost<
      { skill_name: string; skill_names?: string[] },
      { url: string; description?: string; version?: string; tags?: string[] }
    >('/api/skills/import-remote'),
  },
  agents: {
    listModels: httpPost<
      Array<{ modelId: string; name: string }>,
      { backend: string; xaiworkHost: string; xaiworkAuthToken: string }
    >('/api/agents/xaiwork/models', (params) => ({
      backend: params.backend,
      xaiwork_host: params.xaiworkHost,
      xaiwork_auth_token: params.xaiworkAuthToken,
    })),
    applyModel: httpPost<void, { backend: string; modelId: string; xaiworkHost: string; xaiworkAuthToken: string }>(
      '/api/agents/xaiwork/apply',
      (params) => ({
        backend: params.backend,
        model_id: params.modelId,
        xaiwork_host: params.xaiworkHost,
        xaiwork_auth_token: params.xaiworkAuthToken,
      })
    ),
  },
};
