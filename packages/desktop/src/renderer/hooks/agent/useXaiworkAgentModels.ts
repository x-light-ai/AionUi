// FORK-CUSTOM: fork-only hook for loading XAIWork agent models.
/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

// FORK-CUSTOM: Fetch the model list a builtin agent may use via AionCore's
// XAIWork config broker (`POST /api/agents/xaiwork/models`). The renderer
// only receives public model identity + reasoning capabilities; credentials stay server-side.
import type { AcpModelInfo } from '@/common/types/platform/acpTypes';
import type { AgentRuntimeDerivedOption } from '@/renderer/utils/model/agentRuntimeCatalog';
import { createAgentModelsClient, type XaiworkAgentModel } from '@/renderer/hooks/market/agentModelsClient';
import { readXaiworkRemoteAuth } from '@/renderer/hooks/xaiworkRemoteAuth';
import { useMemo } from 'react';
import useSWR from 'swr';

export interface UseXaiworkAgentModelsResult {
  models: XaiworkAgentModel[];
  byModelId: Map<string, XaiworkAgentModel>;
  hasModels: boolean;
  isLoading: boolean;
}

const EMPTY: XaiworkAgentModel[] = [];

type XaiworkThoughtLevelOption = Omit<AgentRuntimeDerivedOption, 'currentValue'> & { currentValue: string };

const REASONING_EFFORT_LABELS: Record<string, string> = {
  minimal: 'Minimal',
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  xhigh: 'Extra High',
};

function getReasoningEffortLabel(value: string): string {
  return (
    REASONING_EFFORT_LABELS[value.toLowerCase()] ||
    value.replaceAll(/[-_]+/g, ' ').replaceAll(/\b\w/g, (character) => character.toUpperCase())
  );
}

export function buildXaiworkThoughtLevelOption(
  modelReasoningEfforts: string[] | null | undefined,
  runtimeOption?: { id: string; category: string; currentValue?: string | null }
): XaiworkThoughtLevelOption | null {
  const seen = new Set<string>();
  const options = (modelReasoningEfforts ?? [])
    .map((value) => value.trim())
    .filter((value) => {
      const key = value.toLowerCase();
      if (!value || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((value) => ({ value, label: getReasoningEffortLabel(value) }));

  if (options.length === 0) return null;

  const runtimeCurrentValue = options.find((option) => option.value === runtimeOption?.currentValue)?.value;
  return {
    id: runtimeOption?.id ?? 'reasoning_effort',
    category: runtimeOption?.category ?? 'thought_level',
    currentValue:
      runtimeCurrentValue ??
      options.find((option) => option.value.toLowerCase() === 'medium')?.value ??
      options[0].value,
    options,
  };
}

/**
 * Build an AcpModelInfo from XAIWork-distributed models. Shared by the ACP
 * model selector and the guid page so the dropdown list + current-model
 * resolution stay identical. Returns null when there are no distributed models.
 *
 * @param models - distributed models for the active backend
 * @param preferredModelIds - candidate current-model ids in priority order;
 *   the first one present in `models` wins, else the first distributed model.
 */
export function buildXaiworkModelInfo(
  models: XaiworkAgentModel[],
  preferredModelIds: Array<string | null | undefined>
): AcpModelInfo | null {
  if (models.length === 0) return null;
  const available = models.map((m) => ({ id: m.modelId, label: m.name }));
  const byId = new Map(models.map((m) => [m.modelId, m]));
  const current = preferredModelIds.find((id): id is string => !!id && byId.has(id)) ?? available[0].id;
  return {
    current_model_id: current,
    current_model_label: byId.get(current)?.name ?? current,
    available_models: available,
  };
}

export function useXaiworkAgentModels(backend?: string): UseXaiworkAgentModelsResult {
  const remote = readXaiworkRemoteAuth();
  const authToken = remote?.accessToken ?? '';
  // Trailing 16 chars of the JWT act as a stable-per-user cache tag so account
  // switches (same host + backend, different user) don't reuse the previous
  // user's model list. Never log or render this tag.
  const tokenTag = authToken.slice(-16);

  const key = backend && authToken ? (['xaiwork-agent-models', backend, tokenTag] as const) : null;

  const { data, isLoading } = useSWR(
    key,
    ([, b]) => createAgentModelsClient(authToken).listModels(b),
    // Distribution rarely changes; avoid hammering the relay on focus.
    { revalidateOnFocus: false, shouldRetryOnError: false }
  );

  const models = data ?? EMPTY;
  const byModelId = useMemo(() => new Map(models.map((m) => [m.modelId, m])), [models]);

  return { models, byModelId, hasModels: models.length > 0, isLoading };
}
