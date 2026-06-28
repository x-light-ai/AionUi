/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

// FORK-CUSTOM: Apply a XAIWork model's config to the local builtin agent.
// Supplements config_json.env with base_url/api_key/model_id, writes agent env,
// and merges the full config_json into local CLI settings in one operation.
import { ipcBridge } from '@/common';
import type { XaiworkAgentModel } from './agentModelsClient';

/**
 * Apply a model's config to a builtin agent (claude / codex).
 * Takes effect for CLI processes spawned after this call—caller must start a new conversation.
 *
 * @param backend - builtin agent backend, e.g. 'claude' or 'codex'
 * @param model - the selected model from XAIWork
 */
export async function applyXaiworkModelConfig(backend: string, model: XaiworkAgentModel): Promise<void> {
  await ipcBridge.acpConversation.setBuiltinAgentConfig.invoke({
    backend,
    baseUrl: model.baseUrl,
    apiKey: model.apiKey,
    modelId: model.modelId,
    configJson: model.configJson || '{}',
  });
}
