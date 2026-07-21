// FORK-CUSTOM: XAIWork model reasoning capabilities before ACP runtime discovery.
import { buildXaiworkThoughtLevelOption } from '@/renderer/hooks/agent/useXaiworkAgentModels';
import type { AgentRuntimeDerivedOption } from '@/renderer/utils/model/agentRuntimeCatalog';

export function resolveXaiworkThoughtLevelOption(
  runtimeOption: AgentRuntimeDerivedOption | null,
  modelReasoningEfforts: string[] | null | undefined
): AgentRuntimeDerivedOption | null {
  if (runtimeOption?.options.length) return runtimeOption;
  return buildXaiworkThoughtLevelOption(modelReasoningEfforts, runtimeOption ?? undefined);
}
