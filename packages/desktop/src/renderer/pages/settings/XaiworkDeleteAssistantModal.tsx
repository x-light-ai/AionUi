// FORK-CUSTOM: 替代上游 DeleteAssistantModal，将"删除"改为"卸载"
import type { AssistantListItem } from './AssistantSettings/types';
import AssistantAvatar from './AssistantSettings/AssistantAvatar';
import { Modal } from '@arco-design/web-react';
import React from 'react';
import { useTranslation } from 'react-i18next';

type XaiworkDeleteAssistantModalProps = {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  activeAssistant: AssistantListItem | null;
};

const XaiworkDeleteAssistantModal: React.FC<XaiworkDeleteAssistantModalProps> = ({
  visible,
  onCancel,
  onConfirm,
  activeAssistant,
}) => {
  const { t } = useTranslation();

  return (
    <Modal
      title={t('xaiwork.myAssistant.uninstallTitle', { defaultValue: 'Uninstall Assistant' })}
      visible={visible}
      onCancel={onCancel}
      onOk={onConfirm}
      okButtonProps={{ status: 'danger' }}
      wrapClassName='delete-assistant-modal'
      data-testid='modal-delete-assistant'
      okText={t('xaiwork.myAssistant.uninstallOkText', { defaultValue: 'Uninstall' })}
      cancelText={t('common.cancel', { defaultValue: 'Cancel' })}
      className='w-[90vw] md:w-[400px]'
      wrapStyle={{ zIndex: 10000 }}
      maskStyle={{ zIndex: 9999 }}
    >
      <p>
        {t('xaiwork.myAssistant.uninstallConfirm', {
          defaultValue: 'Are you sure you want to uninstall this assistant?',
        })}
      </p>
      {activeAssistant && (
        <div className='mt-12px p-12px bg-fill-2 rounded-lg flex items-center gap-12px'>
          <AssistantAvatar assistant={activeAssistant} size={32} />
          <div>
            <div className='font-medium'>{activeAssistant.name}</div>
            <div className='text-12px text-t-secondary'>{activeAssistant.description}</div>
          </div>
        </div>
      )}
    </Modal>
  );
};

export default XaiworkDeleteAssistantModal;
