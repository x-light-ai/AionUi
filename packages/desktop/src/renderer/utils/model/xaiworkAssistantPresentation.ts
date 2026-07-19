// FORK-CUSTOM: centralize XAIWork assistant visibility and display-only naming.
import { isAionrsAssistant, type Assistant } from '@/common/types/agent/assistantTypes';

type AssistantRuntimeIdentity = Pick<Assistant, 'source' | 'name' | 'agent'>;

export function isXaiworkOpenAiAssistant(assistant: AssistantRuntimeIdentity): boolean {
  return (
    assistant.source === 'generated' &&
    (assistant.agent?.acp_backend === 'codex' || assistant.name.trim().toLowerCase() === 'codex cli')
  );
}

export function isXaiworkHiddenAssistant(assistant: AssistantRuntimeIdentity): boolean {
  return assistant.source === 'generated' && isAionrsAssistant(assistant);
}

export function resolveXaiworkAssistantDisplayName(assistant: Assistant, localeKey: string): string {
  if (isXaiworkOpenAiAssistant(assistant)) return 'OpenAI';
  return assistant.name_i18n?.[localeKey] || assistant.name;
}

export function resolveXaiworkSendBoxTargetName(
  agentName: string | undefined,
  backend: string,
  assistantId?: string
): string {
  const name = agentName || backend;
  const isCodexRuntime = backend.trim().toLowerCase() === 'codex';
  const isGeneratedAssistant = assistantId?.startsWith('bare:');
  const isLegacyRuntime = !assistantId && name.trim().toLowerCase() === 'codex cli';

  return isCodexRuntime && (isGeneratedAssistant || isLegacyRuntime) ? 'OpenAI' : name;
}

export function presentXaiworkAssistant(assistant: Assistant): Assistant {
  if (!isXaiworkOpenAiAssistant(assistant)) return assistant;
  return { ...assistant, name: 'OpenAI', name_i18n: {} };
}

export function presentXaiworkAssistants(assistants: Assistant[]): Assistant[] {
  return assistants.map(presentXaiworkAssistant);
}
