// FORK-CUSTOM: 助手详情页 fork 版本的「规则」区块。深度复制自上游 AssistantSettings/editor/RulesSection.tsx。
// XAIWork 定制：去掉编辑/预览切换，规则始终以预览（Markdown）方式展示。保留展开/收起。
import MarkdownView from '@/renderer/components/Markdown';
import { Button } from '@arco-design/web-react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { SectionCard } from './xaiworkEditorSectionPrimitives';

type RulesSectionProps = {
  rulesExpanded: boolean;
  setRulesExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  rulesContainerHeight: string;
  editContext: string;
  readOnlyLabel: string;
};

const XaiworkRulesSection: React.FC<RulesSectionProps> = ({
  rulesExpanded,
  setRulesExpanded,
  rulesContainerHeight,
  editContext,
  readOnlyLabel,
}) => {
  const { t } = useTranslation();

  return (
    <SectionCard
      title={t('settings.assistantRules', { defaultValue: 'Rules' })}
      legend={{
        label: t('settings.assistantOnlyNewConversation', { defaultValue: 'New conversations only' }),
        tone: 'next',
      }}
      readOnlyLabel={readOnlyLabel}
      extra={
        <Button
          type='text'
          size='mini'
          data-testid='btn-expand-rules'
          onClick={() => setRulesExpanded((previous) => !previous)}
        >
          {rulesExpanded
            ? t('common.collapse', { defaultValue: 'Collapse' })
            : t('common.expand', { defaultValue: 'Expand' })}
        </Button>
      }
      testId='assistant-card-rules'
    >
      <div
        className='overflow-hidden rounded-12px border border-border-2 bg-fill-1'
        style={{ height: rulesContainerHeight }}
      >
        <div className='h-full overflow-auto px-14px py-12px text-13px leading-22px text-t-secondary'>
          {editContext ? (
            <MarkdownView hiddenCodeCopyButton>{editContext}</MarkdownView>
          ) : (
            <div className='py-24px text-center text-t-tertiary'>
              {t('settings.promptPreviewEmpty', { defaultValue: 'No content to preview' })}
            </div>
          )}
        </div>
      </div>
    </SectionCard>
  );
};

export default XaiworkRulesSection;
