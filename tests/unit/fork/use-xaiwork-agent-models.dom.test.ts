/**
 * FORK-CUSTOM: tests for the XAIWork agent models SWR hook.
 * @vitest-environment jsdom
 *
 * useXaiworkAgentModels gates the model fetch on backend + host + token being
 * all present (credential safety: no relay call without a logged-in XAIWork
 * session), and exposes models + a byModelId lookup + hasModels.
 */

import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { useConfigMock, readRemoteAuthMock, listModelsMock, createClientMock } = vi.hoisted(() => {
  const listModelsMock = vi.fn();
  return {
    useConfigMock: vi.fn(),
    readRemoteAuthMock: vi.fn(),
    listModelsMock,
    createClientMock: vi.fn(() => ({ listModels: listModelsMock })),
  };
});

vi.mock('@/renderer/hooks/config/useConfig', () => ({
  useConfig: (key: string) => useConfigMock(key),
}));

vi.mock('@/renderer/hooks/xaiworkRemoteAuth', () => ({
  readXaiworkRemoteAuth: () => readRemoteAuthMock(),
}));

vi.mock('@/renderer/hooks/market/agentModelsClient', () => ({
  createAgentModelsClient: (host: string, token: string) => createClientMock(host, token),
}));

import { useXaiworkAgentModels } from '@renderer/hooks/agent/useXaiworkAgentModels';

describe('renderer/useXaiworkAgentModels', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useConfigMock.mockReturnValue(['https://api.xaiwork.com', vi.fn()]);
    readRemoteAuthMock.mockReturnValue({
      accessToken: 'jwt-token-1234567890abcdef',
      refreshToken: 'r',
      accessExpiresIn: 1,
    });
  });

  it('fetches and exposes models + byModelId when backend, host and token are present', async () => {
    listModelsMock.mockResolvedValue([{ modelId: 'x-1', name: 'X One' }]);

    const { result } = renderHook(() => useXaiworkAgentModels('claude'));

    await waitFor(() => expect(result.current.hasModels).toBe(true));
    expect(result.current.models).toEqual([{ modelId: 'x-1', name: 'X One' }]);
    expect(result.current.byModelId.get('x-1')).toEqual({ modelId: 'x-1', name: 'X One' });
    expect(createClientMock).toHaveBeenCalledWith('https://api.xaiwork.com', 'jwt-token-1234567890abcdef');
  });

  it('does not fetch when backend is missing', () => {
    const { result } = renderHook(() => useXaiworkAgentModels(undefined));

    expect(listModelsMock).not.toHaveBeenCalled();
    expect(result.current.hasModels).toBe(false);
    expect(result.current.models).toEqual([]);
  });

  it('does not fetch when the XAIWork session token is missing', () => {
    readRemoteAuthMock.mockReturnValue(null);

    const { result } = renderHook(() => useXaiworkAgentModels('claude'));

    expect(listModelsMock).not.toHaveBeenCalled();
    expect(result.current.hasModels).toBe(false);
  });

  it('does not fetch when the admin host is unset', () => {
    useConfigMock.mockReturnValue([undefined, vi.fn()]);

    const { result } = renderHook(() => useXaiworkAgentModels('claude'));

    expect(listModelsMock).not.toHaveBeenCalled();
    expect(result.current.hasModels).toBe(false);
  });
});
