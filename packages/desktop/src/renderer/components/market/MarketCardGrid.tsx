import React from 'react';
import { Button, Typography } from '@arco-design/web-react';
import { IconDelete, IconDownload, IconRefresh } from '@arco-design/web-react/icon';
import type { RemoteMarketCard } from '@/renderer/hooks/market/useRemoteMarket';

interface MarketCardGridProps {
  emptyText: string;
  installText: string;
  installedText: string;
  removeText: string;
  loading: boolean;
  items: RemoteMarketCard[];
  error?: string;
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
    <div className='grid grid-cols-1 gap-10px sm:grid-cols-2 lg:grid-cols-4'>
      {items.map((item) => (
        <div
          key={`${item.itemType}-${item.id}`}
          className='flex min-h-[180px] flex-col rounded-12px border border-solid border-[var(--color-border-2)] bg-[var(--color-bg-2)] p-10px transition-colors hover:border-[var(--color-border-3)]'
        >
          <Typography.Text bold className='mb-6px block min-h-36px text-center text-13px leading-18px line-clamp-2'>
            {item.name}
          </Typography.Text>

          <div className='mb-6px flex h-40px items-center justify-center'>
            <div className='flex h-36px w-36px items-center justify-center rounded-10px bg-fill-2 text-16px font-bold text-t-secondary'>
              {(item.iconText || item.name.charAt(0) || '?').slice(0, 2)}
            </div>
          </div>

          <Typography.Text className='mb-10px block min-h-28px text-center text-11px leading-15px text-t-secondary line-clamp-2'>
            {item.description}
          </Typography.Text>

          <div className='mb-10px flex flex-wrap justify-center gap-6px'>
            <span className='rounded-10px bg-[rgba(var(--primary-6),0.08)] px-8px py-1px text-10px font-medium text-primary-6'>
              {item.version}
            </span>
          </div>

          <div className='mt-auto flex justify-center gap-8px'>
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
