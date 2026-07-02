/**
 * @vitest-environment jsdom
 *
 * useAcpModelInfoXaiwork wraps the upstream ACP model info: it surfaces only
 * XAIWork-distributed models when present, and transparently falls back to the
 * upstream handshake list otherwise.
 */

import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { useAcpModelInfoMock, useXaiworkAgentModelsMock, useConfigMock } = vi.hoisted(() => ({
  useAcpModelInfoMock: vi.fn(),
  useXaiworkAgentModelsMock: vi.fn(),
  useConfigMock: vi.fn(),
}));

vi.mock('@renderer/hooks/agent/useAcpModelInfo', () => ({
  useAcpModelInfo: (params: unknown) => useAcpModelInfoMock(params),
}));

vi.mock('@renderer/hooks/agent/useXaiworkAgentModels', () => ({
  useXaiworkAgentModels: (backend?: string) => useXaiworkAgentModelsMock(backend),
}));

vi.mock('@renderer/hooks/config/useConfig', () => ({
  useConfig: (key: string) => useConfigMock(key),
}));

import { useAcpModelInfoXaiwork } from '@renderer/hooks/agent/useAcpModelInfoXaiwork';

// Mirror the useXaiworkAgentModels return shape: models + hasModels + byModelId Map.
const xaiwork = (models: { modelId: string; name: string }[]) => ({
  models,
  hasModels: models.length > 0,
  byModelId: new Map(models.map((m) => [m.modelId, m])),
});

const baseInfo = {
  model_info: {
    current_model_id: 'up-1',
    current_model_label: 'Upstream One',
    available_models: [
      { id: 'up-1', label: 'Upstream One' },
      { id: 'up-2', label: 'Upstream Two' },
    ],
  },
  canSwitch: false,
  selectModel: vi.fn(),
};

const params = { conversation_id: 'c1', backend: 'claude', enabled: true };

describe('renderer/useAcpModelInfoXaiwork', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAcpModelInfoMock.mockReturnValue(baseInfo);
    useConfigMock.mockReturnValue(['https://api.xaiwork.com', vi.fn()]);
  });

  it('falls back to the upstream result when XAIWork has no models', () => {
    useXaiworkAgentModelsMock.mockReturnValue(xaiwork([]));

    const { result } = renderHook(() => useAcpModelInfoXaiwork(params));

    expect(result.current).toBe(baseInfo);
    expect(result.current.canSwitch).toBe(false);
  });

  it('replaces available_models with the distributed list and enables switching', () => {
    useXaiworkAgentModelsMock.mockReturnValue(
      xaiwork([
        { modelId: 'x-1', name: 'X One' },
        { modelId: 'x-2', name: 'X Two' },
      ])
    );

    const { result } = renderHook(() => useAcpModelInfoXaiwork(params));

    expect(result.current.model_info?.available_models).toEqual([
      { id: 'x-1', label: 'X One' },
      { id: 'x-2', label: 'X Two' },
    ]);
    // upstream current 'up-1' not in distributed list -> first distributed model
    expect(result.current.model_info?.current_model_id).toBe('x-1');
    expect(result.current.canSwitch).toBe(true);
  });

  it('keeps the upstream current_model_id when it is still in the distributed list', () => {
    useXaiworkAgentModelsMock.mockReturnValue(
      xaiwork([
        { modelId: 'up-1', name: 'Upstream One' },
        { modelId: 'x-2', name: 'X Two' },
      ])
    );

    const { result } = renderHook(() => useAcpModelInfoXaiwork(params));

    expect(result.current.model_info?.current_model_id).toBe('up-1');
  });

  it('does not query XAIWork models when disabled', () => {
    useXaiworkAgentModelsMock.mockReturnValue(xaiwork([]));

    renderHook(() => useAcpModelInfoXaiwork({ ...params, enabled: false }));

    // backend forwarded as undefined when disabled
    expect(useXaiworkAgentModelsMock).toHaveBeenCalledWith(undefined);
  });
});
