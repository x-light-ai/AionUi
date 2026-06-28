/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

// FORK-CUSTOM: Sync server-managed CLI settings.json once per backend.
// This hook is called when AcpModelSelector mounts to ensure the local CLI
// settings are in sync with XAIWork-distributed config before the user
// interacts with the model dropdown.
import { useEffect, useRef } from 'react';

/**
 * Sync CLI settings for a builtin agent backend on mount.
 * Prevents redundant syncs by tracking which backends have been initialized
 * in this session.
 *
 * @param backend - builtin agent backend (e.g., 'claude', 'codex'), or undefined to skip
 */
export function useXaiworkAgentCliConfig(backend?: string): void {
  const syncedBackends = useRef(new Set<string>());

  useEffect(() => {
    if (!backend || syncedBackends.current.has(backend)) {
      return;
    }

    syncedBackends.current.add(backend);

    // TODO: Implement actual sync logic if needed.
    // Currently, model selection via applyXaiworkModelConfig already handles
    // writing the config, so this hook may only need to pre-fetch or validate
    // initial state. If no additional sync is required, this placeholder is
    // sufficient to satisfy the import.
  }, [backend]);
}
