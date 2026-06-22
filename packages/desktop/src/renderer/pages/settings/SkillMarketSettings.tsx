/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { Message } from '@arco-design/web-react';
import { Refresh, Search } from '@icon-park/react';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import MarketCardGrid from '@/renderer/components/market/MarketCardGrid';
import { useRemoteMarket, type RemoteMarketCard } from '@/renderer/hooks/market/useRemoteMarket';

const SkillMarketSettings: React.FC = () => {
  const { t } = useTranslation();
  const remoteMarket = useRemoteMarket('skill');
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
      Message.success(t('settings.skillMarket.installSuccess', { defaultValue: 'Skill installed successfully' }));
    } catch (error) {
      console.error('Failed to install remote market skill:', error);
      Message.error(t('settings.skillMarket.installError', { defaultValue: 'Failed to install skill' }));
    }
  };

  const handleRemove = async (item: RemoteMarketCard) => {
    try {
      await remoteMarket.remove(item);
      Message.success(t('settings.skillsHub.deleteSuccess', { defaultValue: 'Skill deleted' }));
    } catch (error) {
      console.error('Failed to remove remote market skill:', error);
      Message.error(t('settings.skillsHub.deleteError', { defaultValue: 'Error deleting skill' }));
    }
  };

  return (
    <div className='flex flex-col h-full w-full'>
      <div className='space-y-16px pb-24px'>
        <div className='px-[16px] md:px-[32px] py-32px bg-base rd-16px md:rd-24px shadow-sm border border-b-base relative overflow-hidden transition-all'>
          {/* Header */}
          <div className='flex items-center justify-between gap-16px mb-24px'>
            <div className='flex items-center gap-10px shrink-0'>
              <span className='text-16px md:text-18px text-t-primary font-bold tracking-tight'>
                {t('settings.skillMarket.title', { defaultValue: 'Skill Market' })}
              </span>
              <span className='bg-[rgba(var(--primary-6),0.08)] text-primary-6 text-12px px-10px py-2px rd-[100px] font-medium ml-4px'>
                {remoteMarket.items.length}
              </span>
            </div>
            <button
              data-testid='btn-refresh-market'
              className='outline-none border-none bg-transparent cursor-pointer p-6px text-t-tertiary hover:text-primary-6 transition-colors rd-full hover:bg-fill-2'
              onClick={() => {
                void remoteMarket.reload();
              }}
              title={t('common.refresh', { defaultValue: 'Refresh' })}
            >
              <Refresh theme='outline' size={16} className={remoteMarket.loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Search */}
          <div className='relative group w-full mb-16px'>
            <div className='absolute left-12px top-1/2 -translate-y-1/2 text-t-tertiary group-focus-within:text-primary-6 flex pointer-events-none transition-colors'>
              <Search size={15} />
            </div>
            <input
              data-testid='input-search-market'
              type='text'
              className='w-full bg-fill-1 hover:bg-fill-2 border border-border-1 focus:border-primary-5 focus:bg-base outline-none rd-8px py-6px pl-36px pr-12px text-13px text-t-primary placeholder:text-t-tertiary transition-all shadow-sm box-border m-0'
              placeholder={t('settings.skillMarket.searchPlaceholder', { defaultValue: 'Search market skills...' })}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Tag filter */}
          {remoteMarket.tags.length > 0 && (
            <div className='flex flex-wrap gap-8px mb-24px'>
              <button
                className={`text-12px px-12px py-4px rd-[100px] font-medium border border-solid transition-colors cursor-pointer outline-none ${activeTagId == null ? 'bg-[rgba(var(--primary-6),0.08)] text-primary-6 border-[rgba(var(--primary-6),0.2)]' : 'bg-transparent text-t-secondary border-border-1 hover:border-border-2'}`}
                onClick={() => setActiveTagId(null)}
              >
                {t('common.all', { defaultValue: 'All' })}
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

          <MarketCardGrid
            emptyText={t('settings.skillMarket.empty', { defaultValue: 'No skills available in the market.' })}
            installText={t('settings.agentManagement.marketInstall', { defaultValue: 'Install' })}
            installedText={t('settings.installed', { defaultValue: 'Installed' })}
            removeText={t('settings.agentManagement.marketUninstall', { defaultValue: 'Uninstall' })}
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

export default SkillMarketSettings;
