// FORK-CUSTOM: fork-only tests for XAIWork agent models.
/**
 * FORK-CUSTOM: tests for the XAIWork agent models SWR hook.
 * @vitest-environment jsdom
 *
 * useXaiworkAgentModels gates the Core broker request on backend + a logged-in
 * XAIWork token, exposing models + lookup + loading state.
 */

import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { readRemoteAuthMock, listModelsMock, createClientMock } = vi.hoisted(() => {
  const listModels = vi.fn();
  return {
    readRemoteAuthMock: vi.fn(),
    listModelsMock: listModels,
    createClientMock: vi.fn(() => ({ listModels })),
  };
});

vi.mock('@/renderer/hooks/xaiworkRemoteAuth', () => ({
  readXaiworkRemoteAuth: () => readRemoteAuthMock(),
}));

vi.mock('@/renderer/hooks/market/agentModelsClient', () => ({
  createAgentModelsClient: (token: string) => createClientMock(token),
}));

import { useXaiworkAgentModels } from '@renderer/hooks/agent/useXaiworkAgentModels';

describe('renderer/useXaiworkAgentModels', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    readRemoteAuthMock.mockReturnValue({
      accessToken: 'jwt-token-1234567890abcdef',
      refreshToken: 'r',
      accessExpiresIn: 1,
    });
  });

  it('fetches through the Core-owned host when backend and token are present', async () => {
    const model = { modelId: 'x-1', name: 'X One', reasoningEfforts: ['low', 'medium', 'high'] };
    listModelsMock.mockResolvedValue([model]);

    const { result } = renderHook(() => useXaiworkAgentModels('claude'));

    await waitFor(() => expect(result.current.hasModels).toBe(true));
    expect(result.current.models).toEqual([model]);
    expect(result.current.byModelId.get('x-1')).toEqual(model);
    expect(createClientMock).toHaveBeenCalledWith('jwt-token-1234567890abcdef');
  });

  it('fetches Codex models through the XAIWork broker', async () => {
    listModelsMock.mockResolvedValue([
      { modelId: 'codex-x-1', name: 'Codex X One', reasoningEfforts: ['medium', 'high', 'xhigh'] },
    ]);

    const { result } = renderHook(() => useXaiworkAgentModels('codex'));

    await waitFor(() => expect(result.current.hasModels).toBe(true));
    expect(listModelsMock).toHaveBeenCalledWith('codex');
    expect(result.current.models).toEqual([
      { modelId: 'codex-x-1', name: 'Codex X One', reasoningEfforts: ['medium', 'high', 'xhigh'] },
    ]);
  });

  it('reports loading while the API model request is pending', () => {
    listModelsMock.mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useXaiworkAgentModels('pending-backend'));

    expect(result.current.isLoading).toBe(true);
    expect(result.current.models).toEqual([]);
  });

  it('does not fetch when backend is missing', () => {
    const { result } = renderHook(() => useXaiworkAgentModels(undefined));

    expect(listModelsMock).not.toHaveBeenCalled();
    expect(result.current.hasModels).toBe(false);
    expect(result.current.models).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('does not fetch when the XAIWork session token is missing', () => {
    readRemoteAuthMock.mockReturnValue(null);

    const { result } = renderHook(() => useXaiworkAgentModels('claude'));

    expect(listModelsMock).not.toHaveBeenCalled();
    expect(result.current.hasModels).toBe(false);
    expect(result.current.isLoading).toBe(false);
  });
});
