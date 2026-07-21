// FORK-CUSTOM: fork-only tests for XAIWork ACP model information.
/**
 * FORK-CUSTOM: tests for the XAIWork ACP model-info override hook.
 * @vitest-environment jsdom
 *
 * useAcpModelInfoXaiwork surfaces only XAIWork-distributed models and never
 * falls back to the upstream handshake list.
 */

import { render, renderHook } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { acpModelSelectorPropsMock, useAcpModelInfoMock, useXaiworkAgentModelsMock } = vi.hoisted(() => ({
  acpModelSelectorPropsMock: vi.fn(),
  useAcpModelInfoMock: vi.fn(),
  useXaiworkAgentModelsMock: vi.fn(),
}));

vi.mock('@renderer/hooks/agent/useAcpModelInfo', () => ({
  useAcpModelInfo: (params: unknown) => useAcpModelInfoMock(params),
}));

vi.mock('@renderer/hooks/agent/useXaiworkAgentModels', async (importOriginal) => {
  // Keep the real buildXaiworkModelInfo helper; only stub the SWR hook.
  const actual = await importOriginal<typeof import('@renderer/hooks/agent/useXaiworkAgentModels')>();
  return {
    ...actual,
    useXaiworkAgentModels: (backend?: string) => useXaiworkAgentModelsMock(backend),
  };
});

vi.mock('@/renderer/components/agent/AcpModelSelector', () => ({
  default: (props: unknown) => {
    acpModelSelectorPropsMock(props);
    return null;
  },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => (key === 'settings.noAvailableModels' ? 'No available models' : key),
  }),
}));

import { useAcpModelInfoXaiwork } from '@renderer/hooks/agent/useAcpModelInfoXaiwork';
import XaiworkAcpModelSelector from '@/renderer/components/agent/xaiwork/XaiworkAcpModelSelector';

// Mirror the useXaiworkAgentModels return shape.
const xaiwork = (models: { modelId: string; name: string; reasoningEfforts?: string[] }[], isLoading = false) => ({
  models,
  hasModels: models.length > 0,
  byModelId: new Map(models.map((m) => [m.modelId, m])),
  isLoading,
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
  thoughtLevel: {
    id: 'reasoning_effort',
    category: 'thought_level',
    currentValue: 'low',
    options: ['low', 'medium', 'high', 'xhigh', 'max'].map((value) => ({ value, label: value })),
  },
};

const params = { conversation_id: 'c1', backend: 'claude', enabled: true };

describe('renderer/useAcpModelInfoXaiwork', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAcpModelInfoMock.mockReturnValue(baseInfo);
  });

  it('exposes no model when XAIWork has no models', () => {
    useXaiworkAgentModelsMock.mockReturnValue(xaiwork([]));

    const { result } = renderHook(() => useAcpModelInfoXaiwork(params));

    expect(result.current.model_info).toBeNull();
    expect(result.current.canSwitch).toBe(false);
    expect(result.current.selectModel).not.toBe(baseInfo.selectModel);
  });

  it('uses the API catalog loading state instead of the upstream runtime state', () => {
    useXaiworkAgentModelsMock.mockReturnValue(xaiwork([], true));

    const { result } = renderHook(() => useAcpModelInfoXaiwork(params));

    expect(result.current.model_info).toBeNull();
    expect(result.current.isLoading).toBe(true);
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

  it('uses the current OpenAPI model reasoning efforts instead of the runtime option list', () => {
    useXaiworkAgentModelsMock.mockReturnValue(
      xaiwork([
        { modelId: 'up-1', name: 'Upstream One', reasoningEfforts: ['low', 'medium', 'high', 'xhigh'] },
        { modelId: 'x-2', name: 'X Two', reasoningEfforts: ['medium', 'high'] },
      ])
    );

    const { result } = renderHook(() => useAcpModelInfoXaiwork(params));

    expect(result.current.thoughtLevel?.currentValue).toBe('low');
    expect(result.current.thoughtLevel?.options.map((option) => option.value)).toEqual([
      'low',
      'medium',
      'high',
      'xhigh',
    ]);
  });

  it('updates reasoning efforts from the OpenAPI entry for the current model', () => {
    useAcpModelInfoMock.mockReturnValue({
      ...baseInfo,
      model_info: {
        ...baseInfo.model_info,
        current_model_id: 'x-2',
        current_model_label: 'X Two',
      },
    });
    useXaiworkAgentModelsMock.mockReturnValue(
      xaiwork([
        { modelId: 'up-1', name: 'Upstream One', reasoningEfforts: ['low', 'medium', 'high', 'xhigh'] },
        { modelId: 'x-2', name: 'X Two', reasoningEfforts: ['medium', 'high'] },
      ])
    );

    const { result } = renderHook(() => useAcpModelInfoXaiwork(params));

    expect(result.current.thoughtLevel?.currentValue).toBe('medium');
    expect(result.current.thoughtLevel?.options.map((option) => option.value)).toEqual(['medium', 'high']);
  });

  it('hides runtime thought levels when OpenAPI declares no reasoning efforts', () => {
    useXaiworkAgentModelsMock.mockReturnValue(xaiwork([{ modelId: 'up-1', name: 'Upstream One' }]));

    const { result } = renderHook(() => useAcpModelInfoXaiwork(params));

    expect(result.current.thoughtLevel).toBeNull();
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

  it('uses the distributed model catalog for Codex', () => {
    useXaiworkAgentModelsMock.mockReturnValue(
      xaiwork([
        { modelId: 'codex-x-1', name: 'Codex X One' },
        { modelId: 'codex-x-2', name: 'Codex X Two' },
      ])
    );

    const { result } = renderHook(() =>
      useAcpModelInfoXaiwork({ conversation_id: 'codex-c1', backend: 'codex', enabled: true })
    );

    expect(useXaiworkAgentModelsMock).toHaveBeenCalledWith('codex');
    expect(result.current.model_info?.available_models.map((model) => model.id)).toEqual(['codex-x-1', 'codex-x-2']);
    expect(result.current.canSwitch).toBe(true);
  });

  it('does not query XAIWork models when disabled', () => {
    useXaiworkAgentModelsMock.mockReturnValue(xaiwork([]));

    renderHook(() => useAcpModelInfoXaiwork({ ...params, enabled: false }));

    // backend forwarded as undefined when disabled
    expect(useXaiworkAgentModelsMock).toHaveBeenCalledWith(undefined);
  });
});

describe('XaiworkAcpModelSelector', () => {
  it('injects the XAIWork lifecycle and empty-state copy into the upstream selector', () => {
    render(React.createElement(XaiworkAcpModelSelector, { conversation_id: 'c1', backend: 'claude' }));

    expect(acpModelSelectorPropsMock).toHaveBeenCalledWith(
      expect.objectContaining({
        conversation_id: 'c1',
        backend: 'claude',
        useModelInfo: useAcpModelInfoXaiwork,
        modelUnavailableTooltip: 'No available models',
      })
    );
  });
});
