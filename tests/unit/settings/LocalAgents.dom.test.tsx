// FORK-CUSTOM: fork-owned tests for XAIWork local Agent visibility.
/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LocalAgents from '@/renderer/pages/settings/AgentSettings/LocalAgents';

const useManagedAgentsMock = vi.fn();
const useXaiworkConfigMock = vi.fn();

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { defaultValue?: string }) => options?.defaultValue || key,
  }),
}));

vi.mock('@/renderer/hooks/agent/useManagedAgents', () => ({
  useManagedAgents: () => useManagedAgentsMock(),
}));

vi.mock('@/renderer/hooks/useXaiworkConfig', () => ({
  useXaiworkConfig: () => useXaiworkConfigMock(),
}));

vi.mock('@/common', () => ({
  ipcBridge: {
    acpConversation: {
      updateCustomAgent: { invoke: vi.fn() },
      createCustomAgent: { invoke: vi.fn() },
      deleteCustomAgent: { invoke: vi.fn() },
      setAgentEnabled: { invoke: vi.fn() },
    },
  },
}));

vi.mock('@/renderer/pages/settings/AgentSettings/AgentCard', () => ({
  default: ({ agent }: { agent: { name: string } }) => <div>{agent.name}</div>,
}));

vi.mock('@/renderer/pages/settings/AgentSettings/InlineAgentEditor', () => ({
  default: () => null,
}));

vi.mock('@/renderer/components/base/AionModal', () => ({
  default: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
}));

const renderWithRouter = (ui: React.ReactElement) => render(<MemoryRouter>{ui}</MemoryRouter>);

describe('LocalAgents', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useManagedAgentsMock.mockReturnValue({
      agents: [
        {
          id: 'aionrs-1',
          name: 'Aion CLI',
          agent_type: 'aionrs',
          backend: 'aionrs',
          agent_source: 'builtin',
          status: 'online',
        },
        {
          id: 'claude-1',
          name: 'Claude Code',
          agent_type: 'acp',
          backend: 'claude',
          agent_source: 'builtin',
          status: 'online',
        },
      ],
      isRefreshing: false,
      refreshCatalog: vi.fn(),
    });
  });

  it('renders official agents (Aion CLI is no longer gated behind a fork switch)', () => {
    useXaiworkConfigMock.mockReturnValue({ hideTeamSection: true });

    renderWithRouter(<LocalAgents />);

    // showAionCliInUi gate was removed in 07e300cae; both official agents now always render.
    expect(screen.getByText('Aion CLI')).toBeInTheDocument();
    expect(screen.getByText('Claude Code')).toBeInTheDocument();
  });
});
