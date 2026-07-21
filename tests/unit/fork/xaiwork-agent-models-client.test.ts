// FORK-CUSTOM: fork-only tests for the XAIWork agent model client.
/**
 * FORK-CUSTOM: tests for the XAIWork agent model bridge clients (credential-safe distribution).
 * @vitest-environment node
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { listXaiworkModelsInvoke, applyXaiworkModelInvoke } = vi.hoisted(() => ({
  listXaiworkModelsInvoke: vi.fn(),
  applyXaiworkModelInvoke: vi.fn(),
}));

vi.mock('@/common/adapter/xaiworkBridge', () => ({
  xaiworkBridge: {
    agents: {
      listModels: { invoke: listXaiworkModelsInvoke },
      applyModel: { invoke: applyXaiworkModelInvoke },
    },
  },
}));

import { createAgentModelsClient } from '@renderer/hooks/market/agentModelsClient';
import { applyXaiworkModelConfig } from '@renderer/hooks/market/applyXaiworkModelConfig';

describe('market/agentModelsClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('forwards backend + token to the XAIWork bridge', async () => {
    const models = [{ modelId: 'm1', name: 'Model One', reasoningEfforts: ['low', 'medium', 'high'] }];
    listXaiworkModelsInvoke.mockResolvedValue(models);

    const client = createAgentModelsClient('jwt-token');
    const result = await client.listModels('claude');

    expect(listXaiworkModelsInvoke).toHaveBeenCalledWith({
      backend: 'claude',
      xaiworkAuthToken: 'jwt-token',
    });
    expect(result).toBe(models);
  });

  it('does not leak credentials into the returned model shape', async () => {
    // Contract guard: only public model identity + capabilities reach the renderer.
    listXaiworkModelsInvoke.mockResolvedValue([
      { modelId: 'm1', name: 'Model One', reasoningEfforts: ['low', 'high'] },
    ]);

    const client = createAgentModelsClient('jwt-token');
    const [model] = await client.listModels('codex');

    expect(Object.keys(model).toSorted()).toEqual(['modelId', 'name', 'reasoningEfforts'].toSorted());
  });
});

describe('market/applyXaiworkModelConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('forwards backend + modelId + token to the XAIWork bridge', async () => {
    applyXaiworkModelInvoke.mockResolvedValue(undefined);

    await applyXaiworkModelConfig('claude', 'model-42', 'jwt-token');

    expect(applyXaiworkModelInvoke).toHaveBeenCalledWith({
      backend: 'claude',
      modelId: 'model-42',
      xaiworkAuthToken: 'jwt-token',
    });
  });

  it('propagates IPC rejection to the caller', async () => {
    applyXaiworkModelInvoke.mockRejectedValue(new Error('apply failed'));

    await expect(applyXaiworkModelConfig('codex', 'm1', 'jwt-token')).rejects.toThrow('apply failed');
  });
});
