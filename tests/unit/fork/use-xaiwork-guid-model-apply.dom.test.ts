// FORK-CUSTOM: fork-only tests for XAIWork guide model application.
/**
 * FORK-CUSTOM: tests for the guid-page immediate XAIWork model-apply hook.
 * @vitest-environment jsdom
 *
 * useXaiworkGuidModelApply returns a callback that applies a XAIWork-distributed
 * model immediately when the user switches models on the guid page. It must:
 * - apply only when the id belongs to the distribution for the active backend
 * - skip non-XAIWork ids and no-distribution backends (upstream behaviour intact)
 * - skip when host/token are unavailable
 * - dedupe repeated clicks on the same backend+model
 * - reset dedupe on failure so the user can retry
 */

import { renderHook } from '@testing-library/react';
import { act } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { XAIWORK_BRAND } from '@/common/config/xaiworkBrand';

const { applyMock, readRemoteAuthMock, messageSuccessMock, messageErrorMock } = vi.hoisted(() => ({
  applyMock: vi.fn(),
  readRemoteAuthMock: vi.fn(),
  messageSuccessMock: vi.fn(),
  messageErrorMock: vi.fn(),
}));

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

import { useXaiworkGuidModelApply } from '@renderer/pages/guid/hooks/useXaiworkGuidModelApply';

describe('renderer/useXaiworkGuidModelApply', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    readRemoteAuthMock.mockReturnValue({ accessToken: 'jwt-1234567890abcdef' });
    applyMock.mockResolvedValue(undefined);
  });

  it('applies a distributed model immediately and shows success', async () => {
    const { result } = renderHook(() => useXaiworkGuidModelApply('claude', ['x-1']));

    await act(async () => {
      result.current('x-1');
      await Promise.resolve();
    });

    expect(applyMock).toHaveBeenCalledWith('claude', 'x-1', XAIWORK_BRAND.apiHost, 'jwt-1234567890abcdef');
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
