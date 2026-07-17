/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { ConfigProvider } from '@arco-design/web-react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import AssistantSettings from '@/renderer/pages/settings/AssistantSettings';
// FORK-CUSTOM: verify the XAIWork assistant hub's top-level chat and detail navigation.
import XaiworkAssistantListPanel from '@/renderer/pages/settings/XaiworkAssistantListPanel';
import AgentBadge from '@/renderer/components/agent/AgentBadge';
import type { Assistant } from '@/common/types/agent/assistantTypes';

const useAssistantListMock = vi.fn();
const useAssistantEditorMock = vi.fn();

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, options?: { defaultValue?: string }) => options?.defaultValue || _key,
  }),
}));

vi.mock('@arco-design/web-react', async () => {
  const actual = await vi.importActual<typeof import('@arco-design/web-react')>('@arco-design/web-react');
  return {
    ...actual,
    Message: {
      useMessage: () => [{ success: vi.fn(), error: vi.fn(), warning: vi.fn() }, <div key='message-context' />],
    },
  };
});

vi.mock('@/renderer/hooks/assistant', () => ({
  useAssistantList: () => useAssistantListMock(),
  useAssistantEditor: (params: unknown) => useAssistantEditorMock(params),
}));

vi.mock('@/renderer/hooks/context/LayoutContext', () => ({
  useLayoutContext: () => ({ isMobile: false }),
}));

vi.mock('@/renderer/pages/settings/components/SettingsPageWrapper', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid='settings-wrapper'>{children}</div>,
}));

vi.mock('@/renderer/pages/settings/AssistantSettings/AssistantEditorPage', () => ({
  default: () => <div data-testid='assistant-editor-page' />,
}));

vi.mock('@/renderer/pages/settings/AssistantSettings/AssistantListPanel', () => ({
  default: () => <div data-testid='assistant-list-panel' />,
}));

vi.mock('@/renderer/pages/settings/AssistantSettings/DeleteAssistantModal', () => ({
  default: () => null,
}));

vi.mock('@/renderer/pages/settings/AssistantSettings/SkillConfirmModals', () => ({
  default: () => null,
}));

vi.mock('@/renderer/pages/settings/AssistantSettings/assistantUtils', async () => {
  const actual = await vi.importActual<typeof import('@/renderer/pages/settings/AssistantSettings/assistantUtils')>(
    '@/renderer/pages/settings/AssistantSettings/assistantUtils'
  );

  return {
    ...actual,
    resolveAvatarImageSrc: () => undefined,
  };
});

describe('AssistantSettings', () => {
  beforeEach(() => {
    useAssistantListMock.mockReturnValue({
      assistants: [],
      activeAssistantId: 'assistant-1',
      setActiveAssistantId: vi.fn(),
      activeAssistant: null,
      loadAssistants: vi.fn(),
      reorderAssistants: vi.fn(),
      localeKey: 'en-US',
    });

    useAssistantEditorMock.mockReturnValue({
      editVisible: true,
      isCreating: false,
      editName: '',
      setEditName: vi.fn(),
      editDescription: '',
      setEditDescription: vi.fn(),
      editAvatar: '',
      setEditAvatar: vi.fn(),
      editAgent: 'claude',
      setEditAgent: vi.fn(),
      editRecommendedPromptsText: '',
      setEditRecommendedPromptsText: vi.fn(),
      defaultModelMode: 'auto',
      setDefaultModelMode: vi.fn(),
      defaultModelValue: '',
      setDefaultModelValue: vi.fn(),
      defaultPermissionMode: 'auto',
      setDefaultPermissionMode: vi.fn(),
      defaultPermissionValue: '',
      setDefaultPermissionValue: vi.fn(),
      defaultSkillsMode: 'fixed',
      setDefaultSkillsMode: vi.fn(),
      defaultMcpMode: 'auto',
      setDefaultMcpMode: vi.fn(),
      availableMcpServers: [],
      selectedMcpIds: [],
      setSelectedMcpIds: vi.fn(),
      editContext: '',
      setEditContext: vi.fn(),
      promptViewMode: 'preview',
      setPromptViewMode: vi.fn(),
      availableSkills: [],
      selectedSkills: [],
      setSelectedSkills: vi.fn(),
      pendingSkills: [],
      setDeletePendingSkillName: vi.fn(),
      setDeleteCustomSkillName: vi.fn(),
      builtinAutoSkills: [],
      disabledBuiltinSkills: [],
      setDisabledBuiltinSkills: vi.fn(),
      handleSave: vi.fn(),
      handleDeleteClick: vi.fn(),
      handleDuplicate: vi.fn(),
      handleDeleteRequest: vi.fn(),
      handleToggleEnabled: vi.fn(),
      handleEdit: vi.fn(),
      handleCreate: vi.fn(),
      deleteConfirmVisible: false,
      setDeleteConfirmVisible: vi.fn(),
      deletePendingSkillName: null,
      deleteCustomSkillName: null,
      customSkills: [],
      setCustomSkills: vi.fn(),
      setPendingSkills: vi.fn(),
      handleDeleteConfirm: vi.fn(),
      setEditVisible: vi.fn(),
    });
  });

  it('keeps the editor visible when an existing assistant session is open and activeAssistant is temporarily null', () => {
    render(
      <ConfigProvider>
        <MemoryRouter>
          <AssistantSettings />
        </MemoryRouter>
      </ConfigProvider>
    );

    expect(screen.getByTestId('assistant-editor-page')).toBeInTheDocument();
    expect(screen.queryByTestId('assistant-list-panel')).not.toBeInTheDocument();
  });
});

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

const renderXaiworkAssistantList = (assistant: Assistant, onStartChat = vi.fn()) => {
  const onEdit = vi.fn();
  render(
    <ConfigProvider>
      <MemoryRouter>
        <XaiworkAssistantListPanel
          assistants={[assistant]}
          localeKey='en-US'
          onEdit={onEdit}
          onDuplicate={vi.fn()}
          onDelete={vi.fn()}
          onCreate={vi.fn()}
          onToggleEnabled={vi.fn()}
          onStartChat={onStartChat}
          onReorder={vi.fn()}
          setActiveAssistantId={vi.fn()}
        />
      </MemoryRouter>
    </ConfigProvider>
  );
  return { onEdit, onStartChat };
};

describe('XAIWork assistant chat entry', () => {
  it('starts a chat without opening the assistant editor', () => {
    const assistant = createAssistant();
    const { onEdit, onStartChat } = renderXaiworkAssistantList(assistant);

    fireEvent.click(screen.getByTestId('btn-chat-writer'));

    expect(onStartChat).toHaveBeenCalledWith(assistant);
    expect(onEdit).not.toHaveBeenCalled();
  });

  it('does not offer chat for a disabled assistant', () => {
    renderXaiworkAssistantList(createAssistant({ enabled: false }));

    expect(screen.queryByTestId('btn-chat-writer')).not.toBeInTheDocument();
  });
});

const CurrentLocation = () => {
  const location = useLocation();
  return <div data-testid='current-location'>{`${location.pathname}${location.search}`}</div>;
};

describe('XAIWork assistant deep links', () => {
  it('opens the top-level assistant page and preserves the highlighted assistant id', () => {
    render(
      <MemoryRouter initialEntries={['/conversation/current']}>
        <AgentBadge assistantId='writer/special' agent_name='Writer' agentLogoIsFallback />
        <CurrentLocation />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByTestId('agent-badge'));

    expect(screen.getByTestId('current-location')).toHaveTextContent('/assistants?highlight=writer%2Fspecial');
  });

  it('keeps an agent badge without an assistant id on the current page', () => {
    render(
      <MemoryRouter initialEntries={['/conversation/current']}>
        <AgentBadge agent_name='Writer' agentLogoIsFallback />
        <CurrentLocation />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByTestId('agent-badge'));

    expect(screen.getByTestId('current-location')).toHaveTextContent('/conversation/current');
  });
});
