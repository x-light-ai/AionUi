/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { ipcBridge } from '@/common';
import type { AgentMetadata } from '@/renderer/utils/model/agentTypes';
import AionModal from '@/renderer/components/base/AionModal';
import { useAgents } from '@/renderer/hooks/agent/useAgents';
import { useForkConfig } from '@/renderer/hooks/useForkConfig';
import { Button, Typography } from '@arco-design/web-react';
import React, { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import AgentCard from './AgentCard';
import InlineAgentEditor, { type CustomAgentDraft } from './InlineAgentEditor';
import { getAgentKey } from '@/renderer/pages/guid/hooks/agentSelectionUtils';

type LocalAgentsProps = {
  agentSelectorEnabled: boolean;
};

const LocalAgents: React.FC<LocalAgentsProps> = ({ agentSelectorEnabled }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showAionCliInUi } = useForkConfig();

  // Single fetch for all agents; both detected and custom lists are derived from it.
  const { agents: allAgents, revalidate: mutateAgents } = useAgents();

  const detectedAgents = allAgents.filter(
    (a) =>
      (a.agent_type === 'acp' || a.agent_type === 'aionrs') &&
      a.agent_source !== 'custom' &&
      (showAionCliInUi || (a.agent_type !== 'aionrs' && a.backend !== 'aionrs'))
  );

  const customAgents: AgentMetadata[] = allAgents.filter((a) => a.agent_source === 'custom');

  const [editorVisible, setEditorVisible] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AgentMetadata | null>(null);

  const handleSaveCustomAgent = useCallback(
    async (draft: CustomAgentDraft) => {
      const body = {
        name: draft.name,
        command: draft.command,
        icon: draft.icon,
        args: draft.args,
        env: draft.env,
        advanced: draft.advanced,
      };
      try {
        if (editingAgent) {
          await ipcBridge.acpConversation.updateCustomAgent.invoke({ id: editingAgent.id, ...body });
        } else {
          await ipcBridge.acpConversation.createCustomAgent.invoke(body);
        }
        await mutateAgents();
        setEditorVisible(false);
        setEditingAgent(null);
      } catch (err) {
        // Surface backend rejection (e.g. cli_not_found / acp_init_failed) without crashing.
        console.error('save custom agent failed:', err);
      }
    },
    [editingAgent, mutateAgents]
  );

  const handleDeleteCustomAgent = useCallback(
    async (agentId: string) => {
      try {
        await ipcBridge.acpConversation.deleteCustomAgent.invoke({ id: agentId });
        await mutateAgents();
      } catch (err) {
        console.error('delete custom agent failed:', err);
      }
    },
    [mutateAgents]
  );

  const handleToggleCustomAgent = useCallback(
    async (agentId: string, enabled: boolean) => {
      try {
        await ipcBridge.acpConversation.setAgentEnabled.invoke({ id: agentId, enabled });
        await mutateAgents();
      } catch (err) {
        console.error('toggle custom agent failed:', err);
      }
    },
    [mutateAgents]
  );

  // Aion CLI first among detected agents
  const aionrsAgent = detectedAgents?.find((a) => a.agent_type === 'aionrs' || a.backend === 'aionrs');
  const otherDetected = detectedAgents?.filter((a) => a.agent_type !== 'aionrs' && a.backend !== 'aionrs') ?? [];

  const openCustomAgentEditor = useCallback(() => {
    setEditingAgent(null);
    setEditorVisible(true);
  }, []);

  const goToChatWithAgent = useCallback(
    (agent: AgentMetadata) => {
      navigate('/guid', { state: { selectedAgentKey: getAgentKey(agent) } });
    },
    [navigate]
  );

  return (
    <div className='space-y-16px pb-16px'>
      <div className='px-16px md:px-24px lg:px-28px py-14px md:py-16px bg-2 rd-16px'>
        <div className='flex items-center justify-between gap-12px'>
          <Typography.Text className='text-12px font-medium text-t-secondary block'>
            {t('settings.agentManagement.detected')}
          </Typography.Text>
          <Button
            type='text'
            size='mini'
            className='!h-auto !p-0 !text-12px !font-normal !text-primary-6 hover:!text-primary-7 hover:!underline underline-offset-2'
            onClick={openCustomAgentEditor}
          >
            {t('settings.agentManagement.detectCustomAgent')}
          </Button>
        </div>
        <div className='mt-12px grid grid-cols-2 gap-10px md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'>
          {aionrsAgent && (
            <AgentCard
              type='detected'
              agent={aionrsAgent}
              goToChatDisabled={!agentSelectorEnabled}
              onGoToChat={() => goToChatWithAgent(aionrsAgent)}
            />
          )}
          {otherDetected.map((agent) => (
            <AgentCard
              key={agent.backend || agent.agent_type}
              type='detected'
              agent={agent}
              goToChatDisabled={!agentSelectorEnabled}
              onGoToChat={() => goToChatWithAgent(agent)}
            />
          ))}
        </div>
        {(!detectedAgents || detectedAgents.length === 0) && (
          <Typography.Text type='secondary' className='block py-16px text-center text-12px'>
            {t('settings.agentManagement.localAgentsEmpty')}
          </Typography.Text>
        )}
      </div>

      {(editorVisible || (customAgents && customAgents.length > 0)) && (
        <div className='px-16px md:px-24px lg:px-28px py-14px md:py-16px bg-2 rd-16px'>
          <Typography.Text className='text-12px font-medium text-t-secondary block'>
            {t('settings.agentManagement.customAgents', { defaultValue: 'Custom Agents' })}
          </Typography.Text>
          <div className='mt-12px flex flex-col gap-4px'>
            {customAgents?.map((agent) => (
              <AgentCard
                key={agent.id}
                type='custom'
                agent={agent}
                goToChatDisabled={!agentSelectorEnabled}
                onGoToChat={() => goToChatWithAgent(agent)}
                onEdit={() => {
                  setEditingAgent(agent);
                  setEditorVisible(true);
                }}
                onDelete={() => void handleDeleteCustomAgent(agent.id)}
                onToggle={(enabled) => void handleToggleCustomAgent(agent.id, enabled)}
              />
            ))}
          </div>
        </div>
      )}

      <AionModal
        visible={editorVisible}
        onCancel={() => {
          setEditorVisible(false);
          setEditingAgent(null);
        }}
        header={{
          title: editingAgent
            ? t('settings.agentManagement.editCustomAgent')
            : t('settings.agentManagement.detectCustomAgent'),
          showClose: true,
        }}
        footer={null}
        style={{ maxWidth: '92vw', borderRadius: 16 }}
        contentStyle={{
          background: 'var(--dialog-fill-0)',
          borderRadius: 16,
          padding: '20px 24px 16px',
          overflow: 'auto',
        }}
      >
        {/* Conditional mount + key unmounts the editor on close so the
            next `创建自定义 Agent` click always starts from a blank form.
            The inner useEffect([agent]) only resets when the `agent`
            reference changes; two consecutive `null` values would not
            retrigger it. */}
        {editorVisible && (
          <InlineAgentEditor
            key={editingAgent?.id ?? 'new'}
            agent={editingAgent}
            onSave={(agent) => void handleSaveCustomAgent(agent)}
            onCancel={() => {
              setEditorVisible(false);
              setEditingAgent(null);
            }}
          />
        )}
      </AionModal>
    </div>
  );
};

export default LocalAgents;
