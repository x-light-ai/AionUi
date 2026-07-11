// FORK-CUSTOM: 助手详情页 fork 版本的「身份」区块。深度复制自上游 AssistantSettings/editor/IdentitySection.tsx。
// FORK-CUSTOM: 助手详情页 fork 版本的「身份」区块。深度复制自上游 AssistantSettings/editor/IdentitySection.tsx。
// XAIWork 定制：名称/描述改为纯文本展示（非输入框），描述完整多行显示，名称下方追加技能数量；去掉上传图片按钮。
import { Avatar } from '@arco-design/web-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { SectionCard } from './xaiworkEditorSectionPrimitives';

type IdentitySectionProps = {
  editName: string;
  editDescription: string;
  skillCount: number;
  renderAvatarPreview: () => React.ReactNode;
  readOnlyLabel: string;
};

const XaiworkIdentitySection: React.FC<IdentitySectionProps> = ({
  editName,
  editDescription,
  skillCount,
  renderAvatarPreview,
  readOnlyLabel,
}) => {
  const { t } = useTranslation();

  return (
    <SectionCard
      title={t('settings.assistantIdentitySection', { defaultValue: 'Identity' })}
      legend={{
        label: t('settings.assistantEffectiveImmediately', { defaultValue: 'Applies immediately' }),
        tone: 'now',
      }}
      readOnlyLabel={readOnlyLabel}
      testId='assistant-card-identity'
    >
      <div className='flex items-start gap-14px'>
        <Avatar shape='square' size={42} className='!rounded-10px bg-fill-1'>
          {renderAvatarPreview()}
        </Avatar>
        <div className='min-w-0 flex-1 space-y-6px'>
          <div className='text-15px font-600 leading-22px text-t-primary' data-testid='text-assistant-name'>
            {editName || t('settings.agentNamePlaceholder', { defaultValue: 'Enter a name for this agent' })}
          </div>
          <div className='text-12px text-t-tertiary' data-testid='text-assistant-skill-count'>
            {t('xaiwork.myAssistant.skillCount', { defaultValue: '{{count}} skills', count: skillCount })}
          </div>
          <div
            className='whitespace-pre-wrap break-words text-13px leading-20px text-t-secondary'
            data-testid='text-assistant-desc'
          >
            {editDescription ||
              t('settings.assistantDescriptionPlaceholder', { defaultValue: 'What can this assistant help with?' })}
          </div>
        </div>
      </div>
    </SectionCard>
  );
};

export default XaiworkIdentitySection;
