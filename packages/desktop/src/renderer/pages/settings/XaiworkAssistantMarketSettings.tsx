// FORK-CUSTOM: XAIWork 远端"助手市场"页面，由 XaiworkAssistantSettings 的 Market tab 内嵌。
// 数据来自 OpenApi /openapi/market/assistant，经 useRemoteMarket('assistant') 拉取 + 安装/卸载。
import { Message, Modal } from '@arco-design/web-react';
import { Refresh, Search } from '@icon-park/react';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import XaiworkMarketCardGrid from '@/renderer/components/market/XaiworkMarketCardGrid';
import { useRemoteMarket, type RemoteMarketCard } from '@/renderer/hooks/market/useRemoteMarket';

const XaiworkAssistantMarketSettings: React.FC = () => {
  const { t } = useTranslation();

  const remoteMarket = useRemoteMarket('assistant');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTagId, setActiveTagId] = useState<number | null>(null);

  const filteredItems = useMemo<RemoteMarketCard[]>(() => {
    let list = remoteMarket.items;
    if (activeTagId != null) {
      list = list.filter((item) => item.tagIds?.includes(activeTagId));
    }
    const query = searchQuery.trim().toLowerCase();
    if (query) {
      list = list.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          (item.description && item.description.toLowerCase().includes(query))
      );
    }
    return list;
  }, [remoteMarket.items, activeTagId, searchQuery]);

  const handleInstall = async (item: RemoteMarketCard) => {
    try {
      await remoteMarket.install(item);
      Message.success(t('xaiwork.assistantMarket.installSuccess', { defaultValue: '助手安装成功' }));
    } catch (error) {
      console.error('Failed to install remote market assistant:', error);
      Message.error(t('xaiwork.assistantMarket.installError', { defaultValue: '安装助手失败' }));
    }
  };

  const handleRemove = (item: RemoteMarketCard) => {
    Modal.confirm({
      title: t('xaiwork.assistantMarket.uninstallConfirmTitle', { defaultValue: 'Uninstall Assistant' }),
      content: t('xaiwork.assistantMarket.uninstallConfirmContent', {
        name: item.name,
        defaultValue: `Are you sure you want to uninstall "${item.name}"?`,
      }),
      okButtonProps: { status: 'danger' },
      okText: t('xaiwork.assistantMarket.uninstallOkText', { defaultValue: 'Uninstall' }),
      onOk: async () => {
        try {
          await remoteMarket.remove(item);
          Message.success(t('xaiwork.assistantMarket.uninstallSuccess', { defaultValue: 'Assistant uninstalled' }));
        } catch (error) {
          console.error('Failed to remove remote market assistant:', error);
          Message.error(t('xaiwork.assistantMarket.uninstallError', { defaultValue: 'Error uninstalling assistant' }));
        }
      },
    });
  };

  return (
    <div className='flex flex-col h-full w-full'>
      <div className='space-y-16px pb-24px'>
        <div className='px-[16px] md:px-[32px] py-32px bg-base rd-16px md:rd-24px shadow-sm border border-b-base relative overflow-hidden transition-all'>
          <div className='flex items-center justify-between gap-16px mb-24px'>
            <div className='flex items-center gap-10px shrink-0'>
              <span className='text-16px md:text-18px text-t-primary font-bold tracking-tight'>
                {t('xaiwork.assistantMarket.title', { defaultValue: '助手市场' })}
              </span>
              <span className='bg-[rgba(var(--primary-6),0.08)] text-primary-6 text-12px px-10px py-2px rd-[100px] font-medium ml-4px'>
                {remoteMarket.items.length}
              </span>
            </div>
            <button
              data-testid='btn-refresh-assistant-market'
              className='outline-none border-none bg-transparent cursor-pointer p-6px text-t-tertiary hover:text-primary-6 transition-colors rd-full hover:bg-fill-2'
              onClick={() => {
                void remoteMarket.reload();
              }}
              title={t('common.refresh', { defaultValue: 'Refresh' })}
            >
              <Refresh theme='outline' size={16} className={remoteMarket.loading ? 'animate-spin' : ''} />
            </button>
          </div>

          <div className='relative group w-full mb-16px'>
            <div className='absolute left-12px top-1/2 -translate-y-1/2 text-t-tertiary group-focus-within:text-primary-6 flex pointer-events-none transition-colors'>
              <Search size={15} />
            </div>
            <input
              data-testid='input-search-assistant-market'
              type='text'
              className='w-full bg-fill-1 hover:bg-fill-2 border border-border-1 focus:border-primary-5 focus:bg-base outline-none rd-8px py-6px pl-36px pr-12px text-13px text-t-primary placeholder:text-t-tertiary transition-all shadow-sm box-border m-0'
              placeholder={t('xaiwork.assistantMarket.searchPlaceholder', { defaultValue: '搜索市场助手...' })}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {remoteMarket.tags.length > 0 && (
            <div className='flex flex-wrap gap-8px mb-24px'>
              <button
                className={`text-12px px-12px py-4px rd-[100px] font-medium border border-solid transition-colors cursor-pointer outline-none ${activeTagId == null ? 'bg-[rgba(var(--primary-6),0.08)] text-primary-6 border-[rgba(var(--primary-6),0.2)]' : 'bg-transparent text-t-secondary border-border-1 hover:border-border-2'}`}
                onClick={() => setActiveTagId(null)}
              >
                {t('xaiwork.common.all', { defaultValue: 'All' })}
              </button>
              {remoteMarket.tags.map((tag) => (
                <button
                  key={tag.id}
                  className={`text-12px px-12px py-4px rd-[100px] font-medium border border-solid transition-colors cursor-pointer outline-none ${activeTagId === tag.id ? 'bg-[rgba(var(--primary-6),0.08)] text-primary-6 border-[rgba(var(--primary-6),0.2)]' : 'bg-transparent text-t-secondary border-border-1 hover:border-border-2'}`}
                  onClick={() => setActiveTagId(tag.id)}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          )}

          <XaiworkMarketCardGrid
            emptyText={t('xaiwork.assistantMarket.empty', { defaultValue: '市场暂无可用助手。' })}
            installText={t('settings.agentManagement.marketInstall', { defaultValue: 'Install' })}
            installedText={t('settings.installed', { defaultValue: 'Installed' })}
            removeText={t('xaiwork.assistantMarket.uninstallOkText', { defaultValue: 'Uninstall' })}
            loading={remoteMarket.loading}
            items={filteredItems}
            error={remoteMarket.error}
            showTags
            onInstall={handleInstall}
            onRemove={handleRemove}
          />
        </div>
      </div>
    </div>
  );
};

export default XaiworkAssistantMarketSettings;
