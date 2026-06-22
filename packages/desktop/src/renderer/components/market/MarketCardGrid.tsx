import React from 'react';
import { Button, Typography } from '@arco-design/web-react';
import { IconDelete, IconDownload } from '@arco-design/web-react/icon';
import type { RemoteMarketCard } from '@/renderer/hooks/market/useRemoteMarket';
import { getAvatarColorClass } from '@/renderer/pages/settings/components/SkillCard';

interface MarketCardGridProps {
  emptyText: string;
  installText: string;
  installedText: string;
  removeText: string;
  loading: boolean;
  items: RemoteMarketCard[];
  error?: string;
  showTags?: boolean;
  onInstall: (item: RemoteMarketCard) => void;
  onRemove: (item: RemoteMarketCard) => void;
}

const actionButtonClassName = '!min-w-80px !rounded-9px !px-10px';

const MarketCardGrid: React.FC<MarketCardGridProps> = ({
  emptyText,
  installText,
  installedText,
  removeText,
  loading,
  items,
  error,
  showTags = false,
  onInstall,
  onRemove,
}) => {
  if (loading) {
    return (
      <div className='flex items-center justify-center py-48px'>
        <Typography.Text type='secondary'>Please wait...</Typography.Text>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex items-center justify-center py-48px text-center'>
        <Typography.Text type='secondary' className='text-13px text-t-secondary'>
          {error}
        </Typography.Text>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className='flex items-center justify-center py-48px text-center'>
        <Typography.Text type='secondary' className='text-13px text-t-secondary'>
          {emptyText}
        </Typography.Text>
      </div>
    );
  }

  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12px'>
      {items.map((item) => (
        <div
          key={`${item.itemType}-${item.id}`}
          className='group relative flex flex-col gap-10px p-16px bg-fill-1 border border-border-1 hover:border-border-2 hover:bg-fill-2 hover:shadow-sm rd-12px transition-all duration-200'
        >
          <div className='flex items-start gap-12px'>
            <div
              className={`shrink-0 w-40px h-40px rd-10px flex items-center justify-center font-bold text-16px shadow-sm text-transform-uppercase ${getAvatarColorClass(item.name)}`}
            >
              {(item.iconText || item.name.charAt(0) || '?').slice(0, 2).toUpperCase()}
            </div>
            <div className='flex-1 min-w-0 flex flex-col gap-4px'>
              <h3 className='text-14px font-semibold text-t-primary/90 truncate m-0' title={item.name}>
                {item.name}
              </h3>
              <div className='flex flex-wrap gap-6px'>
                {item.version && (
                  <span className='text-11px px-6px py-1px rd-4px font-medium border border-solid bg-[rgba(var(--primary-6),0.08)] text-primary-6 border-[rgba(var(--primary-6),0.2)]'>
                    {item.version}
                  </span>
                )}
                {showTags &&
                  item.tags?.map((tag, index) => (
                    <span
                      key={`${tag}-${index}`}
                      className='text-11px px-6px py-1px rd-4px font-medium border border-solid bg-fill-1 text-t-secondary border-border-1'
                      title={tag}
                    >
                      {tag}
                    </span>
                  ))}
              </div>
            </div>
          </div>

          {item.description && (
            <p className='text-13px text-t-secondary leading-relaxed line-clamp-2 m-0' title={item.description}>
              {item.description}
            </p>
          )}

          <div className='mt-auto flex justify-end gap-8px pt-4px'>
            {item.installed ? (
              <>
                <Button size='small' type='secondary' disabled className={actionButtonClassName}>
                  {installedText}
                </Button>
                <Button
                  size='small'
                  status='danger'
                  icon={<IconDelete />}
                  className={actionButtonClassName}
                  onClick={() => onRemove(item)}
                >
                  {removeText}
                </Button>
              </>
            ) : (
              <Button
                type='primary'
                size='small'
                icon={<IconDownload />}
                className={actionButtonClassName}
                onClick={() => onInstall(item)}
              >
                {installText}
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default MarketCardGrid;
