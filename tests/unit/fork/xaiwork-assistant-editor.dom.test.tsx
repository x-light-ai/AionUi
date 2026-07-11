/**
 * FORK-CUSTOM: XAIWork assistant editor page tests.
 *
 * Guards the fork-only detail page entry so XaiworkMyAssistants keeps using an
 * independent editor page that renders the default-configuration section without
 * introducing a nested scroll container.
 */
import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { ConfigProvider } from '@arco-design/web-react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import XaiworkAssistantEditorPage from '@/renderer/pages/settings/XaiworkAssistantEditor/XaiworkAssistantEditorPage';
import type { AssistantEditorViewModel } from '@/renderer/pages/settings/AssistantSettings/types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, options?: { defaultValue?: string; count?: number }) => {
      if (options?.defaultValue) return options.defaultValue.replace('{{count}}', String(options.count ?? ''));
      return _key;
    },
    i18n: { language: 'en-US', resolvedLanguage: 'en-US' },
  }),
}));

vi.mock('@/renderer/hooks/agent/useModelProviderList', () => ({
  useModelProviderList: () => ({ providers: [], getAvailableModels: () => [] }),
}));

vi.mock('@/renderer/hooks/agent/useManagedAgents', () => ({
  useManagedAgentRuntimeCatalog: () => [],
}));

vi.mock('@/renderer/components/chat/EmojiPicker', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/renderer/components/Markdown', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/common', () => ({
  ipcBridge: {
    dialog: { showOpen: { invoke: vi.fn() } },
    fs: { getImageBase64: { invoke: vi.fn() } },
  },
}));

const renderWithProviders = (ui: React.ReactElement) =>
  render(
    <MemoryRouter>
      <ConfigProvider>{ui}</ConfigProvider>
    </MemoryRouter>
  );

const createEditor = (): AssistantEditorViewModel => ({
  isCreating: false,
  profile: {
    name: 'Data Assistant',
    setName: vi.fn(),
    description: 'Analyze data',
    setDescription: vi.fn(),
    avatar: '📊',
    setAvatar: vi.fn(),
    setAvatarPreview: vi.fn(),
    builtinAvatarOptions: [],
  },
  agent: {
    value: 'agent-claude',
    setValue: vi.fn(),
    availableBackends: [{ id: 'agent-claude', name: 'Claude Code', runtimeKey: 'claude', modelOptions: [] }],
  },
  prompts: {
    text: 'Analyze order data\nSummarize conversion funnel\nSuggest retention ideas',
    setText: vi.fn(),
  },
  defaults: {
    model: { mode: 'auto', setMode: vi.fn(), value: '', setValue: vi.fn() },
    permission: { mode: 'auto', setMode: vi.fn(), value: '', setValue: vi.fn() },
    skills: { mode: 'auto', setMode: vi.fn() },
    mcps: { mode: 'auto', setMode: vi.fn(), availableServers: [], selectedIds: [], setSelectedIds: vi.fn() },
  },
  rules: { content: 'rules', setContent: vi.fn(), viewMode: 'preview', setViewMode: vi.fn() },
  skills: {
    availableSkills: [],
    selectedSkills: [],
    setSelectedSkills: vi.fn(),
    pendingSkills: [],
    setDeletePendingSkillName: vi.fn(),
    setDeleteCustomSkillName: vi.fn(),
    builtinAutoSkills: [],
    disabledBuiltinSkills: [],
    setDisabledBuiltinSkills: vi.fn(),
  },
  actions: { save: vi.fn(), requestDelete: vi.fn(), duplicate: vi.fn() },
});

describe('XaiworkAssistantEditorPage', () => {
  it('keeps defaults in the fork editor and lets content expand naturally', () => {
    renderWithProviders(
      <XaiworkAssistantEditorPage
        editor={createEditor()}
        activeAssistant={{
          id: 'generated-data-assistant',
          name: 'Data Assistant',
          sort_order: 1,
          source: 'generated',
          enabled: true,
          agent_id: 'agent-claude',
          agent: { type: 'acp', source: 'builtin', acp_backend: 'claude' },
        }}
        onBack={vi.fn()}
      />
    );

    expect(screen.getByTestId('assistant-card-defaults')).toBeInTheDocument();
    expect(screen.getByTestId('assistant-editor-page')).not.toHaveClass('h-full');
    expect(screen.getByTestId('assistant-editor-body')).not.toHaveClass('overflow-y-auto');
    expect(screen.getByTestId('assistant-editor-body')).not.toHaveClass('overflow-x-hidden');
  });
});
