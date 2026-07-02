/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

// FORK-CUSTOM: Fetch the model list a builtin agent may use via AionCore's
// XAIWork config broker (`POST /api/agents/xaiwork/models`). The renderer
// only receives `{modelId, name}`; credentials stay server-side.
import { useConfig } from '@/renderer/hooks/config/useConfig';
import { createAgentModelsClient, type XaiworkAgentModel } from '@/renderer/hooks/market/agentModelsClient';
import { readXaiworkRemoteAuth } from '@/renderer/hooks/xaiworkRemoteAuth';
import { useMemo } from 'react';
import useSWR from 'swr';

export interface UseXaiworkAgentModelsResult {
  models: XaiworkAgentModel[];
  byModelId: Map<string, XaiworkAgentModel>;
  hasModels: boolean;
}

const EMPTY: XaiworkAgentModel[] = [];

export function useXaiworkAgentModels(backend?: string): UseXaiworkAgentModelsResult {
  const [host] = useConfig('xaiwork.adminApiHost');
  const effectiveHost = host?.trim() || '';
  const remote = readXaiworkRemoteAuth();
  const authToken = remote?.accessToken ?? '';
  // Trailing 16 chars of the JWT act as a stable-per-user cache tag so account
  // switches (same host + backend, different user) don't reuse the previous
  // user's model list. Never log or render this tag.
  const tokenTag = authToken.slice(-16);

  const key = backend && effectiveHost && authToken
    ? (['xaiwork-agent-models', effectiveHost, backend, tokenTag] as const)
    : null;

  const { data } = useSWR(
    key,
    ([, h, b]) => createAgentModelsClient(h, authToken).listModels(b),
    // Distribution rarely changes; avoid hammering the relay on focus.
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  const models = data ?? EMPTY;
  const byModelId = useMemo(() => new Map(models.map((m) => [m.modelId, m])), [models]);

  return { models, byModelId, hasModels: models.length > 0 };
}
