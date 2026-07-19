// FORK-CUSTOM: XAIWork 定制版"我的助手"页面（替代上游 AssistantSettings 的内容部分）。
// 上游 AssistantSettings/index.tsx 保持原样不动，本文件承载所有 fork 改动，避免 rebase 冲突。
// 与上游差异：1) 隐藏 Aion CLI，其余列表按 XAIWork 的“通用助手 / 专有助手”语义分组；
// 2) 支持 withWrapper prop，由 fork 容器 XaiworkAssistantSettings 的 tab 内嵌（不重复包 SettingsPageWrapper）。
import { Message } from '@arco-design/web-react';
import { Refresh } from '@icon-park/react';
import { useAssistantEditor, useAssistantList } from '@/renderer/hooks/assistant';
import { useManagedAgentRuntimeCatalog } from '@/renderer/hooks/agent/useManagedAgents';
import { isXaiworkHiddenAssistant } from '@/renderer/utils/model/xaiworkAssistantPresentation';
import SettingsPageWrapper from './components/SettingsPageWrapper';
import { buildAssistantEditorBackends, resolveAvatarImageSrc } from './AssistantSettings/assistantUtils';
import XaiworkAssistantListPanel from './XaiworkAssistantListPanel';
import XaiworkAssistantEditorPage from './XaiworkAssistantEditor/XaiworkAssistantEditorPage';
import XaiworkDeleteAssistantModal from './XaiworkDeleteAssistantModal';
import SkillConfirmModals from './AssistantSettings/SkillConfirmModals';
import type { AssistantEditorViewModel, AssistantListItem } from './AssistantSettings/types';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import styles from './XaiworkMyAssistants.module.css';

type AssistantNavigationState = {
  openAssistantId?: string;
  openAssistantEditor?: boolean;
};
const OPEN_ASSISTANT_EDITOR_INTENT_KEY = 'guid.openAssistantEditorIntent';

interface XaiworkMyAssistantsProps {
  /** When false, renders without SettingsPageWrapper — useful for embedding in a tab */
  withWrapper?: boolean;
}

const XaiworkMyAssistants: React.FC<XaiworkMyAssistantsProps> = ({ withWrapper = true }) => {
  const [message, messageContext] = Message.useMessage({ maxCount: 10 });
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigationState = (location.state as AssistantNavigationState | null) ?? null;
  const highlightId = searchParams.get('highlight');
  const handleHighlightConsumed = useCallback(() => {
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);
  const handleStartChat = useCallback(
    (assistant: AssistantListItem) => {
      navigate('/guid', { state: { selectedAssistantId: assistant.id } });
    },
    [navigate]
  );

  // Compose hooks
  const {
    assistants,
    activeAssistantId,
    setActiveAssistantId,
    activeAssistant,
    loadAssistants,
    reorderAssistants,
    localeKey,
  } = useAssistantList();
  const managedAgentRuntimeCatalog = useManagedAgentRuntimeCatalog();
  // FORK-CUSTOM: keep generated CLI assistants visible except the product-internal Aion CLI runtime.
  const visibleAssistants = useMemo(
    () => assistants.filter((assistant) => !isXaiworkHiddenAssistant(assistant)),
    [assistants]
  );

  const builtinAvatarOptions = useMemo(
    () =>
      assistants
        .filter((assistant) => assistant.source === 'builtin' && assistant.avatar?.startsWith('/api/assistants/'))
        .map((assistant) => {
          const src = resolveAvatarImageSrc(assistant.avatar);
          if (!src) {
            return null;
          }

          return {
            id: assistant.id,
            label: assistant.name_i18n?.[localeKey] || assistant.name,
            src,
          };
        })
        .filter((option): option is NonNullable<typeof option> => option !== null),
    [assistants, localeKey]
  );
  const editor = useAssistantEditor({
    localeKey,
    activeAssistant,
    setActiveAssistantId,
    loadAssistants,
    message,
  });
  const availableBackends = useMemo(
    () => buildAssistantEditorBackends(managedAgentRuntimeCatalog, localeKey, editor.editAgent),
    [editor.editAgent, localeKey, managedAgentRuntimeCatalog]
  );

  const editAvatarImage = editor.editAvatarPreview || resolveAvatarImageSrc(editor.editAvatar);
  const hasConsumedNavigationIntentRef = useRef(false);
  const showEditor = editor.editVisible && (editor.isCreating || activeAssistantId !== null);
  const editorViewModel: AssistantEditorViewModel = {
    isCreating: editor.isCreating,
    profile: {
      name: editor.editName,
      setName: editor.setEditName,
      description: editor.editDescription,
      setDescription: editor.setEditDescription,
      avatar: editor.editAvatar,
      setAvatar: editor.setEditAvatar,
      setAvatarPreview: editor.setEditAvatarPreview,
      avatarImage: editAvatarImage,
      builtinAvatarOptions,
    },
    agent: {
      value: editor.editAgent,
      setValue: editor.setEditAgent,
      availableBackends,
    },
    prompts: {
      text: editor.editRecommendedPromptsText,
      setText: editor.setEditRecommendedPromptsText,
    },
    defaults: {
      model: {
        mode: editor.defaultModelMode,
        setMode: editor.setDefaultModelMode,
        value: editor.defaultModelValue,
        setValue: editor.setDefaultModelValue,
      },
      permission: {
        mode: editor.defaultPermissionMode,
        setMode: editor.setDefaultPermissionMode,
        value: editor.defaultPermissionValue,
        setValue: editor.setDefaultPermissionValue,
      },
      thoughtLevel: {
        mode: editor.defaultThoughtLevelMode,
        setMode: editor.setDefaultThoughtLevelMode,
        value: editor.defaultThoughtLevelValue,
        setValue: editor.setDefaultThoughtLevelValue,
      },
      skills: {
        mode: editor.defaultSkillsMode,
        setMode: editor.setDefaultSkillsMode,
      },
      mcps: {
        mode: editor.defaultMcpMode,
        setMode: editor.setDefaultMcpMode,
        availableServers: editor.availableMcpServers,
        selectedIds: editor.selectedMcpIds,
        setSelectedIds: editor.setSelectedMcpIds,
      },
    },
    rules: {
      content: editor.editContext,
      setContent: editor.setEditContext,
      viewMode: editor.promptViewMode,
      setViewMode: editor.setPromptViewMode,
    },
    skills: {
      availableSkills: editor.availableSkills,
      selectedSkills: editor.selectedSkills,
      setSelectedSkills: editor.setSelectedSkills,
      pendingSkills: editor.pendingSkills,
      setDeletePendingSkillName: editor.setDeletePendingSkillName,
      setDeleteCustomSkillName: editor.setDeleteCustomSkillName,
      builtinAutoSkills: editor.builtinAutoSkills,
      disabledBuiltinSkills: editor.disabledBuiltinSkills,
      setDisabledBuiltinSkills: editor.setDisabledBuiltinSkills,
    },
    actions: {
      save: editor.handleSave,
      requestDelete: editor.handleDeleteClick,
      duplicate: (assistant) => void editor.handleDuplicate(assistant),
    },
  };
  useEffect(() => {
    if (hasConsumedNavigationIntentRef.current) return;
    const openAssistantFromRoute =
      navigationState?.openAssistantEditor && navigationState.openAssistantId ? navigationState.openAssistantId : null;

    let openAssistantFromSession: string | null = null;
    try {
      const rawIntent = sessionStorage.getItem(OPEN_ASSISTANT_EDITOR_INTENT_KEY);
      if (rawIntent) {
        const parsedIntent = JSON.parse(rawIntent) as { assistantId?: string; openAssistantEditor?: boolean };
        if (parsedIntent.openAssistantEditor && parsedIntent.assistantId) {
          openAssistantFromSession = parsedIntent.assistantId;
        }
      }
    } catch (error) {
      console.error('[AssistantManagement] Failed to parse assistant open intent:', error);
    }

    const targetAssistantId = openAssistantFromRoute ?? openAssistantFromSession;
    if (!targetAssistantId) return;
    if (assistants.length === 0) return;

    const targetAssistant = visibleAssistants.find((assistant) => assistant.id === targetAssistantId);
    if (!targetAssistant) return;

    hasConsumedNavigationIntentRef.current = true;
    try {
      sessionStorage.removeItem(OPEN_ASSISTANT_EDITOR_INTENT_KEY);
    } catch (error) {
      console.error('[AssistantManagement] Failed to clear assistant open intent:', error);
    }
    void editor.handleEdit(targetAssistant);
  }, [editor, navigationState, visibleAssistants]);

  const mainContent = (
    <div className={showEditor ? 'flex flex-col w-full' : 'flex flex-col h-full w-full'}>
      {messageContext}
      <div className={showEditor ? 'min-h-0' : 'flex-1 min-h-0'}>
        {showEditor ? (
          <XaiworkAssistantEditorPage
            editor={editorViewModel}
            activeAssistant={activeAssistant}
            onBack={() => editor.setEditVisible(false)}
          />
        ) : (
          <div
            className={`${styles.card} bg-base rd-16px md:rd-24px shadow-sm border border-b-base px-[16px] md:px-[32px] py-32px`}
          >
            {/* FORK-CUSTOM: 自渲染 toolbar（标题「我的助手」+ 计数 + 刷新按钮），与「我的技能」一致；
                上游 AssistantListPanel 自带的 header 由 CSS 隐藏，避免重复标题。创建助手入口已按需求移除。 */}
            <div className='flex items-center justify-between gap-16px mb-16px shrink-0'>
              <div className='flex items-center gap-10px shrink-0'>
                <span className='text-16px md:text-18px text-t-primary font-bold tracking-tight'>
                  {t('xaiwork.assistantTab.mine', { defaultValue: '我的助手' })}
                </span>
                <span className='bg-[rgba(var(--primary-6),0.08)] text-primary-6 text-12px px-10px py-2px rd-[100px] font-medium ml-4px'>
                  {visibleAssistants.length}
                </span>
              </div>
              <div className='flex items-center gap-12px shrink-0'>
                <button
                  data-testid='btn-refresh-my-assistants'
                  className='outline-none border-none bg-transparent cursor-pointer p-6px text-t-tertiary hover:text-primary-6 transition-colors rd-full hover:bg-fill-2'
                  onClick={async () => {
                    setLoading(true);
                    try {
                      await loadAssistants();
                      message.success(t('common.refreshSuccess', { defaultValue: 'Refreshed' }));
                    } finally {
                      setLoading(false);
                    }
                  }}
                  title={t('common.refresh', { defaultValue: 'Refresh' })}
                >
                  <Refresh theme='outline' size={16} className={loading ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>
            <XaiworkAssistantListPanel
              assistants={visibleAssistants}
              localeKey={localeKey}
              onEdit={(assistant) => void editor.handleEdit(assistant)}
              onDuplicate={(assistant) => void editor.handleDuplicate(assistant)}
              onDelete={(assistant) => editor.handleDeleteRequest(assistant)}
              onCreate={() => void editor.handleCreate()}
              onToggleEnabled={(assistant, checked) => void editor.handleToggleEnabled(assistant, checked)}
              onStartChat={handleStartChat}
              onReorder={(activeId, overId) => void reorderAssistants(activeId, overId)}
              setActiveAssistantId={setActiveAssistantId}
              highlightId={highlightId}
              onHighlightConsumed={handleHighlightConsumed}
            />
          </div>
        )}

        <XaiworkDeleteAssistantModal
          visible={editor.deleteConfirmVisible}
          onCancel={() => editor.setDeleteConfirmVisible(false)}
          onConfirm={editor.handleDeleteConfirm}
          activeAssistant={activeAssistant}
        />

        <SkillConfirmModals
          deletePendingSkillName={editor.deletePendingSkillName}
          setDeletePendingSkillName={editor.setDeletePendingSkillName}
          pendingSkills={editor.pendingSkills}
          setPendingSkills={editor.setPendingSkills}
          deleteCustomSkillName={editor.deleteCustomSkillName}
          setDeleteCustomSkillName={editor.setDeleteCustomSkillName}
          customSkills={editor.customSkills}
          setCustomSkills={editor.setCustomSkills}
          selectedSkills={editor.selectedSkills}
          setSelectedSkills={editor.setSelectedSkills}
          message={message}
        />
      </div>
    </div>
  );

  return withWrapper ? (
    <SettingsPageWrapper className='!h-full !overflow-hidden' contentClassName='!h-full'>
      {mainContent}
    </SettingsPageWrapper>
  ) : (
    mainContent
  );
};

export default XaiworkMyAssistants;
