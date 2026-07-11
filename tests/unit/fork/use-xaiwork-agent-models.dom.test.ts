// FORK-CUSTOM: fork-only tests for XAIWork agent models.
/**
 * FORK-CUSTOM: tests for the XAIWork agent models SWR hook.
 * @vitest-environment jsdom
 *
 * useXaiworkAgentModels uses the fixed XAIWORK_BRAND.apiHost and gates the fetch
 * on backend + a logged-in XAIWork token, exposing models + byModelId + hasModels.
 */

import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { XAIWORK_BRAND } from '@/common/config/xaiworkBrand';

const { readRemoteAuthMock, listModelsMock, createClientMock } = vi.hoisted(() => {
  const listModelsMock = vi.fn();
  return {
    readRemoteAuthMock: vi.fn(),
    listModelsMock,
    createClientMock: vi.fn(() => ({ listModels: listModelsMock })),
  };
});

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
    readRemoteAuthMock.mockReturnValue({
      accessToken: 'jwt-token-1234567890abcdef',
      refreshToken: 'r',
      accessExpiresIn: 1,
    });
  });

  it('fetches with the fixed brand host + token when backend is present', async () => {
    listModelsMock.mockResolvedValue([{ modelId: 'x-1', name: 'X One' }]);

    const { result } = renderHook(() => useXaiworkAgentModels('claude'));

    await waitFor(() => expect(result.current.hasModels).toBe(true));
    expect(result.current.models).toEqual([{ modelId: 'x-1', name: 'X One' }]);
    expect(result.current.byModelId.get('x-1')).toEqual({ modelId: 'x-1', name: 'X One' });
    // Host is the fixed XAIWORK_BRAND.apiHost, not a runtime config value.
    expect(createClientMock).toHaveBeenCalledWith(XAIWORK_BRAND.apiHost, 'jwt-token-1234567890abcdef');
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
});
