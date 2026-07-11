// FORK-CUSTOM: 助手详情页 fork 版本入口。深度复制自上游 AssistantSettings/AssistantEditorPage.tsx，并为 XAIWork 保留独立布局演进空间。
import type { AssistantEditorViewModel, AssistantListItem } from '../AssistantSettings/types';
import { Button } from '@arco-design/web-react';
import { ArrowLeft } from '@icon-park/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import XaiworkAssistantEditorSections from './XaiworkAssistantEditorSections';

type XaiworkAssistantEditorPageProps = {
  editor: AssistantEditorViewModel;
  activeAssistant: AssistantListItem | null;
  onBack: () => void;
};

const XaiworkAssistantEditorPage: React.FC<XaiworkAssistantEditorPageProps> = ({ editor, activeAssistant, onBack }) => {
  const { t } = useTranslation();
  const { isCreating, actions, profile } = editor;
  const canSave = isCreating || Boolean(activeAssistant);

  return (
    <div data-testid='assistant-editor-page' className='flex flex-col bg-transparent'>
      <div
        data-testid='assistant-editor-bar'
        className='sticky top-0 z-10 flex h-48px flex-shrink-0 items-center gap-12px border-b border-border-2 bg-bg-0 px-18px'
      >
        <div className='flex min-w-0 items-center gap-10px'>
          <Button
            type='text'
            icon={<ArrowLeft size={16} />}
            onClick={onBack}
            data-testid='btn-back-assistant-editor'
            className='!rounded-8px !px-6px !text-t-primary'
          >
            {t('settings.assistantBackToList', { defaultValue: 'All assistants' })}
          </Button>
          <div className='truncate text-14px font-600 text-t-primary'>
            {profile.name.trim() ||
              (isCreating
                ? t('settings.createAssistant', { defaultValue: 'Create Assistant' })
                : t('settings.editAssistant', { defaultValue: 'Assistant Details' }))}
          </div>
        </div>
        <div className='ml-auto flex items-center gap-8px'>
          <Button onClick={onBack} className='!rounded-8px bg-fill-1' data-testid='btn-cancel-assistant-editor'>
            {t('common.cancel', { defaultValue: 'Cancel' })}
          </Button>
          <Button
            type='primary'
            onClick={actions.save}
            data-testid='btn-save-assistant'
            className='!rounded-8px'
            disabled={!canSave}
          >
            {isCreating ? t('common.create', { defaultValue: 'Create' }) : t('common.save', { defaultValue: 'Save' })}
          </Button>
        </div>
      </div>

      <div data-testid='assistant-editor-body' data-editor-popup-root className='relative px-18px py-18px pb-24px'>
        <div className='mx-auto w-full max-w-760px'>
          <XaiworkAssistantEditorSections editor={editor} activeAssistant={activeAssistant} />
        </div>
      </div>
    </div>
  );
};

export default XaiworkAssistantEditorPage;
