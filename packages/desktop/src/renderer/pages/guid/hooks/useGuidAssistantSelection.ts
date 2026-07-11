/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { assistantRuntimeKey, isAionrsAssistant, type Assistant } from '@/common/types/agent/assistantTypes';
// FORK-CUSTOM: fork 默认值配置
import { XAIWORK_DEFAULTS } from '@/common/config/xaiworkDefaults';
import { configService } from '@/common/config/configService';
import type { AcpModelInfo } from '../types';
import type { AgentModeOption } from '@/renderer/utils/model/agentTypes';
import {
  buildAgentRuntimeModeState,
  buildAgentRuntimeModelInfo,
  type AgentRuntimeCatalog,
} from '@/renderer/utils/model/agentRuntimeCatalog';
import { useManagedAgentRuntimeCatalog } from '@/renderer/hooks/agent/useManagedAgents';
import { useXaiworkAgentModels, buildXaiworkModelInfo } from '@/renderer/hooks/agent/useXaiworkAgentModels';
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useCustomAgentsLoader } from './useCustomAgentsLoader';

export { buildAgentRuntimeModeState, buildAgentRuntimeModelInfo, type AgentRuntimeCatalog };

export type GuidAssistantSelectionResult = {
  selectedAssistantId: string | null;
  setSelectedAssistantId: (assistantId: string) => void;
  defaultAssistantId: string | null;
  selectedAssistant: Assistant | undefined;
  selectedAssistantBackend: string;
  selectedAssistantAvailable: boolean;
  assistants: Assistant[];
  selectedMode: string;
  setSelectedMode: (mode: React.SetStateAction<string>, options?: { persistPreference?: boolean }) => void;
  selectedAcpModel: string | null;
  setSelectedAcpModel: (model: React.SetStateAction<string | null>, options?: { persistPreference?: boolean }) => void;
  currentAcpCachedModelInfo: AcpModelInfo | null;
  // FORK-CUSTOM: XAIWork-distributed ids currently backing the guid model dropdown.
  xaiworkModelIds: string[];
  currentAgentModeOptions: AgentModeOption[];
};

export function resolveInitialAssistantModel(models: string[]): string | null {
  if (models.length > 0) {
    return models[0];
  }

  return null;
}

export function buildAssistantModelInfo(models: string[]): AcpModelInfo | null {
  if (models.length > 0) {
    return {
      current_model_id: models[0],
      current_model_label: models[0],
      available_models: models.map((model) => ({ id: model, label: model })),
    } satisfies AcpModelInfo;
  }

  return null;
}

export function resolveAssistantSelectionKey(
  savedKey: string | undefined,
  assistants: Assistant[]
): string | undefined {
  if (!savedKey) return undefined;

  if (savedKey.startsWith('custom:')) {
    const assistantId = savedKey.slice(7);
    return assistants.some((assistant) => assistant.id === assistantId) ? assistantId : undefined;
  }

  if (assistants.some((assistant) => assistant.id === savedKey)) {
    return savedKey;
  }

  return undefined;
}

function readPersistedGuidAssistantSelectionKey(assistants: Assistant[]): string | undefined {
  const savedKey = configService.get('guid.lastAssistantId');
  const enabledAssistants = assistants.filter((assistant) => assistant.enabled !== false);
  return resolveAssistantSelectionKey(savedKey, enabledAssistants);
}

function persistGuidAssistantSelectionKey(assistantId: string): void {
  void configService.set('guid.lastAssistantId', assistantId).catch((error) => {
    console.error('[Guid] Failed to persist selected assistant:', error);
  });
}

// FORK-CUSTOM: enhanced to support generated-only fallback and configurable default
export function pickDefaultAssistantSelectionKey(assistants: Assistant[], allAssistants?: Assistant[]): string | null {
  const enabledAssistants = assistants.filter((assistant) => assistant.enabled !== false);
  const enabledAll = (allAssistants ?? assistants).filter((assistant) => assistant.enabled !== false);

  // FORK-CUSTOM: prefer by configured agent backend (stable across installs)
  const configuredBackend = XAIWORK_DEFAULTS.defaultAssistantBackend;
  if (configuredBackend) {
    const matchesBackend = (assistant: Assistant): boolean => assistantRuntimeKey(assistant) === configuredBackend;
    const matched = enabledAssistants.find(matchesBackend) ?? enabledAll.find(matchesBackend);
    if (matched) {
      return matched.id;
    }
  }

  // FORK-CUSTOM: fallback to explicit assistant id (machine-specific, e.g. bare:<hash>)
  const configuredDefaultId = XAIWORK_DEFAULTS.defaultAssistantId;
  if (configuredDefaultId) {
    const matched =
      enabledAssistants.find((assistant) => assistant.id === configuredDefaultId) ??
      enabledAll.find((assistant) => assistant.id === configuredDefaultId);
    if (matched) {
      return matched.id;
    }
  }

  // FORK-CUSTOM: prefer builtin/user assistants first (generated filtered out by caller)
  const preferred = enabledAssistants.find((assistant) => isAionrsAssistant(assistant)) ?? enabledAssistants[0];

  // FORK-CUSTOM: fallback to generated assistants when no visible assistants available
  if (!preferred && allAssistants) {
    const enabledGenerated = allAssistants.filter(
      (assistant) => assistant.enabled !== false && assistant.source === 'generated'
    );
    return enabledGenerated.find((assistant) => isAionrsAssistant(assistant))?.id ?? enabledGenerated[0]?.id ?? null;
  }

  return preferred?.id ?? null;
}

type UseGuidAssistantSelectionOptions = {
  resetAssistant?: boolean;
  preselectAssistantId?: string;
  locationKey?: string;
};

export const useGuidAssistantSelection = ({
  resetAssistant,
  preselectAssistantId,
  locationKey,
}: UseGuidAssistantSelectionOptions): GuidAssistantSelectionResult => {
  const [selectedAssistantIdState, _setSelectedAssistantId] = useState<string | null>(null);
  const [selectedMode, _setSelectedMode] = useState<string>('default');
  const [selectedAcpModel, _setSelectedAcpModel] = useState<string | null>(null);
  // FORK-CUSTOM: get both filtered and all assistants for fallback
  const { assistants, allAssistants } = useCustomAgentsLoader();
  const managedAgentRuntimeCatalog = useManagedAgentRuntimeCatalog();

  const setSelectedMode = useCallback(
    (mode: React.SetStateAction<string>, _options?: { persistPreference?: boolean }) => {
      _setSelectedMode((prev) => {
        const nextMode = typeof mode === 'function' ? mode(prev) : mode;
        return nextMode;
      });
    },
    []
  );

  const setSelectedAcpModel = useCallback(
    (modelId: React.SetStateAction<string | null>, _options?: { persistPreference?: boolean }) => {
      _setSelectedAcpModel((prev) => {
        const nextModelId = typeof modelId === 'function' ? modelId(prev) : modelId;
        return nextModelId;
      });
    },
    []
  );

  const setSelectedAssistantId = useCallback(
    (assistantId: string) => {
      const normalizedId = resolveAssistantSelectionKey(assistantId, assistants) ?? assistantId;
      _setSelectedAssistantId(normalizedId);
      persistGuidAssistantSelectionKey(normalizedId);
    },
    [assistants]
  );

  const resetHandledRef = useRef(false);
  const prevLocationKeyRef = useRef(locationKey);
  if (locationKey !== prevLocationKeyRef.current) {
    prevLocationKeyRef.current = locationKey;
    resetHandledRef.current = false;
  }

  useLayoutEffect(() => {
    // FORK-CUSTOM: use allAssistants for length check to avoid empty state when only generated available
    if (allAssistants.length === 0) return;
    if (resetHandledRef.current) return;

    if (preselectAssistantId) {
      // FORK-CUSTOM: try both filtered and all assistants for preselect resolution
      const resolvedPreselect =
        resolveAssistantSelectionKey(preselectAssistantId, assistants) ??
        resolveAssistantSelectionKey(preselectAssistantId, allAssistants);
      if (resolvedPreselect) {
        resetHandledRef.current = true;
        _setSelectedAssistantId(resolvedPreselect);
        return;
      }
    }

    if (resetAssistant) {
      resetHandledRef.current = true;
      // FORK-CUSTOM: prefer persisted selection (upstream), then pass allAssistants for generated fallback
      const fallbackId =
        readPersistedGuidAssistantSelectionKey(assistants) ??
        pickDefaultAssistantSelectionKey(assistants, allAssistants);
      _setSelectedAssistantId(fallbackId);
    }
  }, [assistants, allAssistants, preselectAssistantId, resetAssistant]);

  useEffect(() => {
    // FORK-CUSTOM: use allAssistants for length check
    if (allAssistants.length === 0) return;
    if (resetAssistant) return;
    if (preselectAssistantId && resolveAssistantSelectionKey(preselectAssistantId, assistants)) return;
    // FORK-CUSTOM: check against allAssistants to allow selected generated assistant
    if (!selectedAssistantIdState || !allAssistants.some((assistant) => assistant.id === selectedAssistantIdState)) {
      // FORK-CUSTOM: prefer persisted selection (upstream), then generated fallback via allAssistants
      _setSelectedAssistantId(
        readPersistedGuidAssistantSelectionKey(assistants) ??
          pickDefaultAssistantSelectionKey(assistants, allAssistants)
      );
    }
  }, [assistants, allAssistants, preselectAssistantId, resetAssistant, selectedAssistantIdState]);

  // FORK-CUSTOM: search in allAssistants to allow selected generated assistant to work
  const selectedAssistant = useMemo(
    () =>
      selectedAssistantIdState
        ? allAssistants.find((assistant) => assistant.id === selectedAssistantIdState)
        : undefined,
    [allAssistants, selectedAssistantIdState]
  );
  const selectedAssistantId = selectedAssistant?.id ?? null;
  const selectedAssistantBackend = assistantRuntimeKey(selectedAssistant);
  const selectedAssistantModels = selectedAssistant?.models ?? [];
  // FORK-CUSTOM: distributed models for the active backend
  const { models: xaiworkModels, hasModels: xaiworkHasModels } = useXaiworkAgentModels(
    selectedAssistantBackend || undefined
  );
  // FORK-CUSTOM: expose the exact XAIWork model ids used by the guid dropdown so
  // click-time apply can share this source of truth instead of re-fetching.
  const xaiworkModelIds = useMemo(() => xaiworkModels.map((model) => model.modelId), [xaiworkModels]);
  const selectedManagedAgentRuntimeCatalog = useMemo(
    () =>
      selectedAssistant?.agent_id
        ? managedAgentRuntimeCatalog.find((agent) => agent.id === selectedAssistant.agent_id)
        : undefined,
    [managedAgentRuntimeCatalog, selectedAssistant?.agent_id]
  );
  const selectedAgentRuntimeModelInfo = useMemo(
    () => buildAgentRuntimeModelInfo(selectedManagedAgentRuntimeCatalog),
    [selectedManagedAgentRuntimeCatalog]
  );
  const selectedAgentRuntimeModeState = useMemo(
    () => buildAgentRuntimeModeState(selectedManagedAgentRuntimeCatalog),
    [selectedManagedAgentRuntimeCatalog]
  );
  const currentAgentModeOptions = selectedAgentRuntimeModeState.options;

  const selectedAssistantAvailable = useMemo(() => {
    return selectedAssistant?.agent_status === 'online';
  }, [selectedAssistant]);

  const modelSelectionScopeRef = useRef<string | null>(null);
  useEffect(() => {
    if (xaiworkHasModels && xaiworkModels.length > 0) {
      // FORK-CUSTOM: preserve a user's in-page XAIWork model selection across
      // same-assistant catalog refreshes; only fall back when the selection is
      // missing, invalid, or the assistant scope changed.
      const availableModelIds = new Set(xaiworkModels.map((model) => model.modelId));
      const selectionScope = selectedAssistantId ?? '';
      _setSelectedAcpModel((previousModelId) => {
        const scopeChanged = modelSelectionScopeRef.current !== selectionScope;
        modelSelectionScopeRef.current = selectionScope;

        if (!scopeChanged && previousModelId && availableModelIds.has(previousModelId)) {
          return previousModelId;
        }

        return xaiworkModels[0].modelId;
      });
      return;
    }
    const runtimeModelId =
      selectedAgentRuntimeModelInfo?.current_model_id || selectedAgentRuntimeModelInfo?.available_models[0]?.id;
    const fallbackModelId =
      runtimeModelId ||
      (selectedAssistantModels.length > 0 ? resolveInitialAssistantModel(selectedAssistantModels) : null);
    const availableModelIds = new Set(
      selectedAgentRuntimeModelInfo?.available_models.map((model) => model.id) ?? selectedAssistantModels
    );
    const selectionScope = selectedAssistantId ?? '';

    _setSelectedAcpModel((previousModelId) => {
      const scopeChanged = modelSelectionScopeRef.current !== selectionScope;
      modelSelectionScopeRef.current = selectionScope;

      if (
        !scopeChanged &&
        previousModelId &&
        (availableModelIds.size === 0 || availableModelIds.has(previousModelId))
      ) {
        return previousModelId;
      }

      return fallbackModelId;
    });
    // FORK-CUSTOM: xaiwork deps added so distributed-model branch re-runs on backend/list change
  }, [
    selectedAssistantId,
    selectedAssistantModels,
    selectedAgentRuntimeModelInfo,
    xaiworkHasModels,
    xaiworkModels,
    selectedAssistantBackend,
  ]);

  useEffect(() => {
    const fallbackMode =
      selectedAgentRuntimeModeState.currentMode || selectedAgentRuntimeModeState.options[0]?.value || 'default';
    _setSelectedMode(fallbackMode);
  }, [selectedAgentRuntimeModeState]);

  const currentAcpCachedModelInfo = useMemo(() => {
    // FORK-CUSTOM: XAIWork-distributed models replace the dropdown list when present.
    const xaiworkInfo = buildXaiworkModelInfo(xaiworkModels, [selectedAcpModel]);
    if (xaiworkInfo) {
      return xaiworkInfo;
    }

    if (selectedAgentRuntimeModelInfo) {
      return selectedAgentRuntimeModelInfo;
    }

    return buildAssistantModelInfo(selectedAssistantModels);
  }, [selectedAssistantModels, selectedAgentRuntimeModelInfo, xaiworkModels, selectedAcpModel]);

  // FORK-CUSTOM: pass allAssistants for generated fallback
  const defaultAssistantId = useMemo(
    () => pickDefaultAssistantSelectionKey(assistants, allAssistants),
    [assistants, allAssistants]
  );

  return {
    selectedAssistantId,
    setSelectedAssistantId,
    defaultAssistantId,
    selectedAssistant,
    selectedAssistantBackend,
    selectedAssistantAvailable,
    assistants,
    selectedMode,
    setSelectedMode,
    selectedAcpModel,
    setSelectedAcpModel,
    currentAcpCachedModelInfo,
    xaiworkModelIds,
    currentAgentModeOptions,
  };
};
