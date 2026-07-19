// FORK-CUSTOM: fork-only DOM coverage for XAIWork assistant grouping and naming.
import React from 'react';
import { ConfigProvider } from '@arco-design/web-react';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import type { Assistant } from '@/common/types/agent/assistantTypes';
import XaiworkAssistantListPanel from '@/renderer/pages/settings/XaiworkAssistantListPanel';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, options?: { defaultValue?: string }) => options?.defaultValue || _key,
  }),
}));

vi.mock('@/renderer/hooks/context/LayoutContext', () => ({
  useLayoutContext: () => ({ isMobile: false }),
}));

const createAssistant = (overrides: Partial<Assistant> = {}): Assistant => ({
  id: 'writer',
  source: 'user',
  name: 'Writer',
  name_i18n: {},
  description_i18n: {},
  enabled: true,
  sort_order: 0,
  agent_id: 'claude',
  enabled_skills: [],
  custom_skill_names: [],
  disabled_builtin_skills: [],
  context_i18n: {},
  prompts: [],
  prompts_i18n: {},
  models: [],
  agent_status: 'online',
  team_selectable: true,
  deletable: true,
  ...overrides,
});

const renderList = (assistants: Assistant[]) =>
  render(
    <ConfigProvider>
      <MemoryRouter>
        <XaiworkAssistantListPanel
          assistants={assistants}
          localeKey='en-US'
          onEdit={vi.fn()}
          onDuplicate={vi.fn()}
          onDelete={vi.fn()}
          onCreate={vi.fn()}
          onToggleEnabled={vi.fn()}
          onStartChat={vi.fn()}
          onReorder={vi.fn()}
          setActiveAssistantId={vi.fn()}
        />
      </MemoryRouter>
    </ConfigProvider>
  );

describe('XAIWork assistant groups', () => {
  it('shows scanned Codex as OpenAI under General Assistants', () => {
    renderList([
      createAssistant({
        id: 'bare-codex',
        source: 'generated',
        name: 'Codex CLI',
        agent_id: 'agent-codex',
        agent: { type: 'acp', source: 'builtin', acp_backend: 'codex' },
        deletable: false,
      }),
      createAssistant(),
    ]);

    const generalGroup = screen.getByTestId('assistant-group-general');
    const dedicatedGroup = screen.getByTestId('assistant-group-dedicated');
    expect(within(generalGroup).getByText('General Assistants')).toBeInTheDocument();
    expect(within(generalGroup).getByText('OpenAI')).toBeInTheDocument();
    expect(within(generalGroup).queryByText('Codex CLI')).not.toBeInTheDocument();
    expect(within(dedicatedGroup).getByText('Dedicated Assistants')).toBeInTheDocument();
    expect(within(dedicatedGroup).getByText('Writer')).toBeInTheDocument();
  });

  it('keeps a user-authored Codex CLI name unchanged', () => {
    renderList([createAssistant({ name: 'Codex CLI' })]);

    const dedicatedGroup = screen.getByTestId('assistant-group-dedicated');
    expect(within(dedicatedGroup).getByText('Codex CLI')).toBeInTheDocument();
    expect(screen.queryByText('OpenAI')).not.toBeInTheDocument();
  });
});
