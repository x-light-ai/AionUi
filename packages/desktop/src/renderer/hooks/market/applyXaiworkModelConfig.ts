/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

// FORK-CUSTOM: Apply a XAIWork-distributed model to the local builtin agent.
// AionCore fetches the full config (baseUrl / apiKey / configJson) server-to-
// server from XAIWork OpenApi and writes agent env + local CLI settings.
// The renderer only passes non-sensitive identifiers plus its XAIWork JWT.
import { xaiworkBridge } from '@/common/adapter/xaiworkBridge';

/**
 * Apply a model's config to a builtin agent (claude / codex).
 * Takes effect for CLI processes spawned after this call—caller must start a new conversation.
 *
 * @param backend - builtin agent backend, e.g. 'claude' or 'codex'
 * @param modelId - the selected XAIWork model id
 * @param host - XAIWork OpenApi base URL
 * @param authToken - XAIWork user JWT (forwarded once per request, not persisted)
 */
export async function applyXaiworkModelConfig(
  backend: string,
  modelId: string,
  host: string,
  authToken: string
): Promise<void> {
  await xaiworkBridge.agents.applyModel.invoke({
    backend,
    modelId,
    xaiworkHost: host,
    xaiworkAuthToken: authToken,
  });
}
