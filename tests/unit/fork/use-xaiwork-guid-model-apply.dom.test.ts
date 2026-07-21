// FORK-CUSTOM: fork-only tests for XAIWork guide model application.
/**
 * FORK-CUSTOM: tests for the guid-page immediate XAIWork model-apply hook.
 * @vitest-environment jsdom
 *
 * useXaiworkGuidModelApply returns a callback that applies a XAIWork-distributed
 * model immediately when the user switches models on the guid page. It must:
 * - apply only when the id belongs to the distribution for the active backend
 * - skip non-XAIWork ids and no-distribution backends (upstream behaviour intact)
 * - skip when the XAIWork token is unavailable
 * - apply Codex models through the same distribution path
 * - dedupe repeated clicks on the same backend+model
 * - reset dedupe on failure so the user can retry
 */

import { renderHook } from '@testing-library/react';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { applyMock, readRemoteAuthMock, messageSuccessMock, messageErrorMock, useXaiworkAgentModelsMock } = vi.hoisted(
  () => ({
    applyMock: vi.fn(),
    readRemoteAuthMock: vi.fn(),
    messageSuccessMock: vi.fn(),
    messageErrorMock: vi.fn(),
    useXaiworkAgentModelsMock: vi.fn(),
  })
);

vi.mock('@/renderer/hooks/market/applyXaiworkModelConfig', () => ({
  applyXaiworkModelConfig: (...args: unknown[]) => applyMock(...args),
}));

vi.mock('@/renderer/hooks/xaiworkRemoteAuth', () => ({
  readXaiworkRemoteAuth: () => readRemoteAuthMock(),
}));

vi.mock('@arco-design/web-react', () => ({
  Message: { success: messageSuccessMock, error: messageErrorMock },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/renderer/hooks/agent/useXaiworkAgentModels', () => ({
  useXaiworkAgentModels: (backend?: string) => useXaiworkAgentModelsMock(backend),
}));

import { useXaiworkGuidModelApply } from '@renderer/pages/guid/hooks/useXaiworkGuidModelApply';
import { useXaiworkCreateGuard } from '@renderer/pages/guid/xaiwork/useXaiworkCreateGuard';

describe('renderer/useXaiworkGuidModelApply', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    readRemoteAuthMock.mockReturnValue({ accessToken: 'jwt-1234567890abcdef' });
    applyMock.mockResolvedValue(undefined);
    useXaiworkAgentModelsMock.mockReturnValue({ models: [], byModelId: new Map(), hasModels: false });
  });

  it('applies a distributed model immediately and shows success', async () => {
    const { result } = renderHook(() => useXaiworkGuidModelApply('claude', ['x-1']));

    await act(async () => {
      result.current('x-1');
      await Promise.resolve();
    });

    expect(applyMock).toHaveBeenCalledWith('claude', 'x-1', 'jwt-1234567890abcdef');
    expect(messageSuccessMock).toHaveBeenCalledWith('agent.model.switchSuccess');
  });

  it('does not apply for ids outside the distribution', () => {
    const { result } = renderHook(() => useXaiworkGuidModelApply('claude', ['x-1']));
    act(() => result.current('not-distributed'));

    expect(applyMock).not.toHaveBeenCalled();
  });

  it('does not apply when the backend has no distribution', () => {
    const { result } = renderHook(() => useXaiworkGuidModelApply('claude', []));
    act(() => result.current('x-1'));

    expect(applyMock).not.toHaveBeenCalled();
  });

  it('does not apply when the XAIWork token is missing', () => {
    readRemoteAuthMock.mockReturnValue(null);

    const { result } = renderHook(() => useXaiworkGuidModelApply('claude', ['x-1']));
    act(() => result.current('x-1'));

    expect(applyMock).not.toHaveBeenCalled();
  });

  it('applies a distributed Codex model immediately', async () => {
    const { result } = renderHook(() => useXaiworkGuidModelApply('codex', ['codex-x-1']));

    await act(async () => {
      result.current('codex-x-1');
      await Promise.resolve();
    });

    expect(applyMock).toHaveBeenCalledWith('codex', 'codex-x-1', 'jwt-1234567890abcdef');
  });

  it('dedupes repeated clicks on the same backend+model', async () => {
    const { result } = renderHook(() => useXaiworkGuidModelApply('claude', ['x-1']));

    await act(async () => {
      result.current('x-1');
      await Promise.resolve();
    });
    await act(async () => {
      result.current('x-1');
      await Promise.resolve();
    });

    expect(applyMock).toHaveBeenCalledTimes(1);
  });

  it('resets dedupe on failure so the user can retry, and shows error', async () => {
    applyMock.mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce(undefined);

    const { result } = renderHook(() => useXaiworkGuidModelApply('claude', ['x-1']));

    await act(async () => {
      result.current('x-1');
      await Promise.resolve();
    });
    expect(messageErrorMock).toHaveBeenCalledWith('agent.config.failed');

    await act(async () => {
      result.current('x-1');
      await Promise.resolve();
    });
    expect(applyMock).toHaveBeenCalledTimes(2);
  });
});

describe('renderer/useXaiworkCreateGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    readRemoteAuthMock.mockReturnValue({ accessToken: 'jwt-1234567890abcdef' });
    applyMock.mockResolvedValue(undefined);
    useXaiworkAgentModelsMock.mockReturnValue({
      models: [{ modelId: 'codex-x-1', name: 'Codex X One' }],
      byModelId: new Map([['codex-x-1', { modelId: 'codex-x-1', name: 'Codex X One' }]]),
      hasModels: true,
    });
  });

  it('applies the selected Codex model before creating the conversation', async () => {
    const { result } = renderHook(() => useXaiworkCreateGuard('codex'));

    await act(async () => result.current('codex-x-1'));

    expect(useXaiworkAgentModelsMock).toHaveBeenCalledWith('codex');
    expect(applyMock).toHaveBeenCalledWith('codex', 'codex-x-1', 'jwt-1234567890abcdef');
  });

  it('rejects a model missing from the Codex distribution', async () => {
    const { result } = renderHook(() => useXaiworkCreateGuard('codex'));

    await expect(act(async () => result.current('unknown-codex-model'))).rejects.toThrow(
      "Model 'unknown-codex-model' is not available from XAIWork"
    );

    expect(applyMock).not.toHaveBeenCalled();
  });

  it('rejects conversation creation when XAIWork returns no models', async () => {
    useXaiworkAgentModelsMock.mockReturnValue({ models: [], byModelId: new Map(), hasModels: false });
    const { result } = renderHook(() => useXaiworkCreateGuard('codex'));

    await expect(act(async () => result.current(null))).rejects.toThrow(
      "No XAIWork models available for backend 'codex'"
    );

    expect(applyMock).not.toHaveBeenCalled();
  });
});
