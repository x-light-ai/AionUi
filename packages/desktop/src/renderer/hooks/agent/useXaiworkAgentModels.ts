/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

// FORK-CUSTOM: Fetch the model list a builtin agent may use from XAIWork
// OpenApi. Used to replace (not merge with) the CLI's ACP-handshake model
// list in the chat model dropdown.
import { useConfig } from '@/renderer/hooks/config/useConfig';
import { createAgentModelsClient, type XaiworkAgentModel } from '@/renderer/hooks/market/agentModelsClient';
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

  const key = backend ? (['xaiwork-agent-models', effectiveHost, backend] as const) : null;

  const { data } = useSWR(
    key,
    ([, h, b]) => createAgentModelsClient(h).listModels(b),
    // Distribution rarely changes; avoid hammering the relay on focus.
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  const models = data ?? EMPTY;
  const byModelId = useMemo(() => new Map(models.map((m) => [m.modelId, m])), [models]);

  return { models, byModelId, hasModels: models.length > 0 };
}
