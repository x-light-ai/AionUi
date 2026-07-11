/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

// FORK-CUSTOM: Apply a XAIWork-distributed model immediately when the user
// switches models on the guid (new-conversation) page — mirroring the
// history-conversation behaviour in useAcpModelInfoXaiwork.selectModelXaiwork.
//
// Without this, the guid page only updated local state and deferred the apply
// to conversation-create time (useGuidSend), so clicking a model looked like a
// no-op (no `/api/agents/xaiwork/apply` request was sent). This hook restores
// parity: a click on a distributed model applies it right away.
//
// Non-XAIWork cases (host unset, not logged in, empty distribution, or a model
// that is not in the distributed list) are left untouched — the returned
// callback becomes a no-op and the original local-state behaviour is preserved.
import { XAIWORK_BRAND } from '@/common/config/xaiworkBrand';
import { applyXaiworkModelConfig } from '@/renderer/hooks/market/applyXaiworkModelConfig';
import { readXaiworkRemoteAuth } from '@/renderer/hooks/xaiworkRemoteAuth';
import { Message } from '@arco-design/web-react';
import { useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';

/**
 * Returns a callback that, given a just-selected model id, applies the
 * XAIWork-distributed config for the active backend when (and only when) the
 * id belongs to the guid page's currently displayed XAIWork model list.
 * Deduplicates repeated clicks on the same backend+model so re-selecting an
 * already-applied model does not re-apply.
 *
 * @param backend - active builtin agent backend (e.g. 'claude', 'codex'), or ''
 *   / undefined when no XAIWork-distributed backend is selected.
 * @param distributedModelIds - model ids from the guid dropdown's active
 *   XAIWork-backed AcpModelInfo. Passing the displayed ids avoids a second SWR
 *   state snapshot disagreeing with what the user can actually click.
 */
export function useXaiworkGuidModelApply(
  backend?: string,
  distributedModelIds: string[] = []
): (modelId: string) => void {
  const { t } = useTranslation();
  const distributedModelIdSet = useMemo(() => new Set(distributedModelIds), [distributedModelIds]);
  // Tracks the last successfully-applied `${backend}:${modelId}` to avoid a
  // repeated apply when the same model is clicked again.
  const appliedKeyRef = useRef<string | null>(null);

  return useCallback(
    (modelId: string) => {
      // Not a XAIWork-distributed backend, or the id is not a distributed
      // model → leave the upstream local-state behaviour unchanged.
      if (!backend || !distributedModelIdSet.has(modelId)) {
        console.debug('[XAIWork] skip guid model apply: model is not in displayed XAIWork list', {
          backend,
          modelId,
          displayedCount: distributedModelIdSet.size,
        });
        return;
      }

      const key = `${backend}:${modelId}`;
      if (appliedKeyRef.current === key) {
        return;
      }

      const host = XAIWORK_BRAND.apiHost?.trim() || '';
      const authToken = readXaiworkRemoteAuth()?.accessToken ?? '';
      if (!host || !authToken) {
        console.warn('[XAIWork] skip guid model apply: host/token unavailable', {
          backend,
          modelId,
          hasHost: Boolean(host),
          hasToken: Boolean(authToken),
        });
        return;
      }

      // Optimistically record the key so rapid double-clicks don't double-apply;
      // reset it on failure so the user can retry.
      appliedKeyRef.current = key;
      void applyXaiworkModelConfig(backend, modelId, host, authToken)
        .then(() => {
          Message.success(t('agent.model.switchSuccess'));
        })
        .catch((error) => {
          appliedKeyRef.current = null;
          console.error('Failed to apply XAIWork model config on guid switch:', error);
          Message.error(t('agent.config.failed'));
        });
    },
    [backend, distributedModelIdSet, t]
  );
}
