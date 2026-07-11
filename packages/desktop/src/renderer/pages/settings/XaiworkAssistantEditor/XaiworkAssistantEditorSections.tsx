// FORK-CUSTOM: 助手详情页 fork 版本的区块编排容器。深度复制自上游 AssistantSettings/AssistantEditorSections.tsx，供 XaiworkAssistantEditor 独立演进。
// XAIWork 定制：移除「引擎」「默认配置」两节；身份区块名称/描述改为文本展示并追加技能数量；规则区块仅预览。
import type { AssistantEditorViewModel, AssistantListItem } from '../AssistantSettings/types';
import { Button } from '@arco-design/web-react';
import { Info, Robot } from '@icon-park/react';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import XaiworkIdentitySection from './XaiworkIdentitySection';
import XaiworkPromptsSection from './XaiworkPromptsSection';
import XaiworkRulesSection from './XaiworkRulesSection';

export type XaiworkAssistantEditorSectionsProps = {
  editor: AssistantEditorViewModel;
  activeAssistant: AssistantListItem | null;
};

const XaiworkAssistantEditorSections: React.FC<XaiworkAssistantEditorSectionsProps> = ({ editor, activeAssistant }) => {
  const { t } = useTranslation();
  const [rulesExpanded, setRulesExpanded] = useState(false);
  const [addingPrompt, setAddingPrompt] = useState(false);
  const [newPromptDraft, setNewPromptDraft] = useState('');
  const [editingPromptIndex, setEditingPromptIndex] = useState<number | null>(null);
  const [editingPromptDraft, setEditingPromptDraft] = useState('');

  const { isCreating, profile, prompts, rules, skills, actions } = editor;
  const editName = profile.name;
  const editDescription = profile.description;
  const editAvatar = profile.avatar;
  const editAvatarImage = profile.avatarImage;
  const editRecommendedPromptsText = prompts.text;
  const setEditRecommendedPromptsText = prompts.setText;
  const editContext = rules.content;
  const selectedSkills = skills.selectedSkills;
  const builtinAutoSkills = skills.builtinAutoSkills;
  const disabledBuiltinSkills = skills.disabledBuiltinSkills;
  const handleDuplicate = actions.duplicate;

  const isBuiltin = activeAssistant?.source === 'builtin';
  const isGenerated = activeAssistant?.source === 'generated';
  const isReadOnlyAssistant = isBuiltin;

  const recommendedPromptItems = useMemo(
    () =>
      editRecommendedPromptsText
        .split('\n')
        .map((item) => item.trim())
        .filter(Boolean),
    [editRecommendedPromptsText]
  );
  const readOnlyLabel = t('common.readOnly', { defaultValue: 'Read only' });
  const rulesContainerHeight = rulesExpanded ? '440px' : '240px';

  // FORK-CUSTOM: 生效技能数量 = 手动选择的技能 + 未禁用的内置自动技能，供身份区块展示。
  const skillCount = useMemo(
    () =>
      new Set([
        ...selectedSkills,
        ...builtinAutoSkills.filter((skill) => !disabledBuiltinSkills.includes(skill.name)).map((skill) => skill.name),
      ]).size,
    [builtinAutoSkills, disabledBuiltinSkills, selectedSkills]
  );

  const applyPromptItems = (items: string[]) => {
    setEditRecommendedPromptsText(items.join('\n'));
  };

  const handleBeginPromptEdit = (index: number) => {
    setEditingPromptIndex(index);
    setEditingPromptDraft(recommendedPromptItems[index] ?? '');
  };

  const handleSavePromptEdit = () => {
    if (editingPromptIndex === null) return;
    const trimmed = editingPromptDraft.trim();
    if (!trimmed) return;
    const nextItems = [...recommendedPromptItems];
    nextItems[editingPromptIndex] = trimmed;
    applyPromptItems(nextItems);
    setEditingPromptIndex(null);
    setEditingPromptDraft('');
  };

  const handleDeletePrompt = (index: number) => {
    applyPromptItems(recommendedPromptItems.filter((_, promptIndex) => promptIndex !== index));
    if (editingPromptIndex === index) {
      setEditingPromptIndex(null);
      setEditingPromptDraft('');
    }
  };

  const handleAddPrompt = () => {
    const trimmed = newPromptDraft.trim();
    if (!trimmed) return;
    applyPromptItems([...recommendedPromptItems, trimmed]);
    setAddingPrompt(false);
    setNewPromptDraft('');
  };

  const renderAvatarPreview = () => {
    if (editAvatarImage) {
      return (
        <img
          src={editAvatarImage}
          alt=''
          className='h-full w-full rounded-inherit object-cover'
          style={{ display: 'block' }}
        />
      );
    }

    if (editAvatar) {
      return <span className='text-20px'>{editAvatar}</span>;
    }

    return <Robot theme='outline' size={20} />;
  };

  return (
    <div className='flex flex-col gap-16px pb-24px'>
      {isBuiltin && activeAssistant ? (
        <div
          className='rounded-12px border border-border-2 bg-fill-1 px-14px py-12px text-13px leading-20px text-t-secondary md:rounded-16px'
          data-testid='assistant-builtin-readonly-banner'
        >
          <div className='flex items-start gap-8px'>
            <Info theme='outline' size={16} className='mt-2px flex-shrink-0 text-primary-6' />
            <div>
              <span>
                {t('settings.assistantBuiltinReadonlyTip', {
                  defaultValue:
                    'This is a builtin assistant. You can change Main Agent, Default Model, and Default Permission. To customize other fields, ',
                })}
              </span>
              <Button
                type='text'
                size='mini'
                className='!px-0 !text-primary-6 hover:!text-primary-5'
                onClick={(event) => {
                  event.preventDefault();
                  handleDuplicate(activeAssistant);
                }}
                data-testid='link-duplicate-from-banner'
              >
                {t('settings.assistantBuiltinReadonlyDuplicateLink', { defaultValue: 'duplicate it' })}
              </Button>
              <span>{t('settings.assistantBuiltinReadonlyTipSuffix', { defaultValue: '.' })}</span>
            </div>
          </div>
        </div>
      ) : null}
      {isGenerated ? (
        <div
          className='rounded-12px border border-border-2 bg-fill-1 px-14px py-12px text-13px leading-20px text-t-secondary md:rounded-16px'
          data-testid='assistant-cli-readonly-banner'
        >
          <div className='flex items-start gap-8px'>
            <Info theme='outline' size={16} className='mt-2px flex-shrink-0 text-primary-6' />
            <div>
              {t('settings.assistantCliReadonlyTip', {
                defaultValue:
                  'This assistant is generated by Agents and is linked one-to-one with its CLI. Name, avatar, and main agent are locked; other settings are editable locally and will not be overwritten by updates.',
              })}
            </div>
          </div>
        </div>
      ) : null}

      <XaiworkIdentitySection
        editName={editName}
        editDescription={editDescription}
        skillCount={skillCount}
        renderAvatarPreview={renderAvatarPreview}
        readOnlyLabel={readOnlyLabel}
      />

      <XaiworkPromptsSection
        isReadOnly={isReadOnlyAssistant}
        recommendedPromptItems={recommendedPromptItems}
        addingPrompt={addingPrompt}
        setAddingPrompt={setAddingPrompt}
        newPromptDraft={newPromptDraft}
        setNewPromptDraft={setNewPromptDraft}
        editingPromptIndex={editingPromptIndex}
        setEditingPromptIndex={setEditingPromptIndex}
        editingPromptDraft={editingPromptDraft}
        setEditingPromptDraft={setEditingPromptDraft}
        onAddPrompt={handleAddPrompt}
        onBeginPromptEdit={handleBeginPromptEdit}
        onSavePromptEdit={handleSavePromptEdit}
        onDeletePrompt={handleDeletePrompt}
        readOnlyLabel={readOnlyLabel}
      />

      <XaiworkRulesSection
        rulesExpanded={rulesExpanded}
        setRulesExpanded={setRulesExpanded}
        rulesContainerHeight={rulesContainerHeight}
        editContext={editContext}
        readOnlyLabel={readOnlyLabel}
      />
    </div>
  );
};

export default XaiworkAssistantEditorSections;
