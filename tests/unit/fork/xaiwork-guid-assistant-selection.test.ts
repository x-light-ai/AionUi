// FORK-CUSTOM: fork-only unit tests for XAIWork guide Assistant selection.
import { describe, expect, it } from 'vitest';

import type { Assistant } from '@/common/types/agent/assistantTypes';
import {
  pickDefaultAssistantSelectionKey,
  resolveAssistantSelectionKey,
} from '@/renderer/pages/guid/xaiwork/useXaiworkGuidAssistantSelection';
import {
  isXaiworkHiddenAssistant,
  presentXaiworkAssistants,
  resolveXaiworkAssistantDisplayName,
  resolveXaiworkSendBoxTargetName,
} from '@/renderer/utils/model/xaiworkAssistantPresentation';

describe('guid assistant selection helpers', () => {
  const assistants: Assistant[] = [
    assistant({ id: 'builtin-writer', source: 'builtin', runtimeKey: 'claude', sort_order: 20 }),
    assistant({ id: 'bare-aionrs', source: 'generated', runtimeKey: 'aionrs', sort_order: 10 }),
    assistant({ id: 'user-research', source: 'user', runtimeKey: 'gemini', sort_order: 30 }),
  ];

  it('prefers explicit custom assistant keys when the assistant exists', () => {
    expect(resolveAssistantSelectionKey('custom:user-research', assistants)).toBe('user-research');
  });

  it('does not accept legacy backend keys as assistant selection ids', () => {
    expect(resolveAssistantSelectionKey('claude', assistants)).toBeUndefined();
    expect(resolveAssistantSelectionKey('aionrs', assistants)).toBeUndefined();
  });

  it('selects the first enabled visible assistant', () => {
    expect(pickDefaultAssistantSelectionKey(assistants.filter((a) => a.source !== 'generated'))).toBe('builtin-writer');
  });

  it('skips disabled assistants without using a hidden fallback catalog', () => {
    expect(
      pickDefaultAssistantSelectionKey([
        { ...assistants[0], enabled: false },
        { ...assistants[2], enabled: true },
      ])
    ).toBe('user-research');
  });

  it('returns null when no assistants are available', () => {
    expect(pickDefaultAssistantSelectionKey([])).toBeNull();
  });

  it('hides only the generated Aion CLI assistant', () => {
    expect(isXaiworkHiddenAssistant(assistants[1])).toBe(true);
    expect(isXaiworkHiddenAssistant(assistants[0])).toBe(false);
  });

  it('presents generated Codex as OpenAI without changing its runtime identity', () => {
    const generatedCodex = assistant({
      id: 'bare-codex',
      source: 'generated',
      runtimeKey: 'codex',
    });
    const authoredCodexName = assistant({
      id: 'user-codex-name',
      source: 'user',
      runtimeKey: 'claude',
      name: 'Codex CLI',
    });
    const [presentedCodex, presentedAuthored] = presentXaiworkAssistants([generatedCodex, authoredCodexName]);

    expect(resolveXaiworkAssistantDisplayName(generatedCodex, 'en-US')).toBe('OpenAI');
    expect(presentedCodex).toMatchObject({ id: 'bare-codex', name: 'OpenAI' });
    expect(presentedCodex.agent?.acp_backend).toBe('codex');
    expect(presentedAuthored.name).toBe('Codex CLI');
  });
});

describe('XAIWork conversation assistant presentation', () => {
  it('presents generated and legacy Codex runtimes as OpenAI', () => {
    expect(resolveXaiworkSendBoxTargetName('Codex CLI', 'codex', 'bare:agent-codex')).toBe('OpenAI');
    expect(resolveXaiworkSendBoxTargetName('Codex CLI', 'codex')).toBe('OpenAI');
  });

  it('keeps an authored Codex CLI assistant name unchanged', () => {
    expect(resolveXaiworkSendBoxTargetName('Codex CLI', 'codex', 'user-codex-name')).toBe('Codex CLI');
  });
});

function assistant(
  overrides: Partial<Assistant> & { id: string; source: Assistant['source']; runtimeKey: string }
): Assistant {
  const agentId = `agent-${overrides.runtimeKey}`;
  const isAionrs = overrides.runtimeKey === 'aionrs';
  return {
    id: overrides.id,
    source: overrides.source,
    name: overrides.id,
    name_i18n: {},
    description_i18n: {},
    enabled: true,
    sort_order: overrides.sort_order ?? 0,
    agent_id: agentId,
    agent: isAionrs
      ? { type: 'aionrs', source: 'internal' }
      : { type: 'acp', source: 'builtin', acp_backend: overrides.runtimeKey },
    enabled_skills: [],
    custom_skill_names: [],
    disabled_builtin_skills: [],
    context_i18n: {},
    prompts: [],
    prompts_i18n: {},
    models: [],
    agent_status: 'online',
    team_selectable: true,
    deletable: overrides.source === 'user',
    ...overrides,
  };
}
