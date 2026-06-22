/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

import { Delete, Lightning, Puzzle } from '@icon-park/react';
import React from 'react';

// Avatar color palette shared across skill cards. Hash the name to a stable color.
export const getAvatarColorClass = (name: string): string => {
  if (!name) return 'bg-[#165DFF] text-white';
  const colors = [
    'bg-[#165DFF] text-white', // Blue
    'bg-[#00B42A] text-white', // Green
    'bg-[#722ED1] text-white', // Purple
    'bg-[#F5319D] text-white', // Pink
    'bg-[#F77234] text-white', // Orange
    'bg-[#14C9C9] text-white', // Cyan
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export type SkillCardVariant = 'custom' | 'builtin' | 'extension' | 'auto';

type SkillCardProps = {
  name: string;
  description?: string;
  /** Visual variant — drives icon styling. */
  variant: SkillCardVariant;
  /** Optional skill package version. */
  version?: string;
  /** Optional skill tag labels. */
  tags?: string[];
  /** Highlight when navigated via ?highlight=. */
  highlighted?: boolean;
  /** Delete handler — only rendered when provided (custom skills). */
  onDelete?: () => void;
  deleteTitle?: string;
  'data-testid'?: string;
  deleteTestId?: string;
};

const VERSION_CHIP_CLASS =
  'text-11px px-6px py-1px rd-4px font-medium border border-solid bg-[rgba(var(--primary-6),0.08)] text-primary-6 border-[rgba(var(--primary-6),0.2)]';
const TAG_CHIP_CLASS =
  'text-11px px-6px py-1px rd-4px font-medium border border-solid bg-fill-1 text-t-secondary border-border-1';

const SkillCard = React.forwardRef<HTMLDivElement, SkillCardProps>(
  ({ name, description, variant, version, tags, highlighted, onDelete, deleteTitle, deleteTestId, ...rest }, ref) => {
    const renderIcon = () => {
      if (variant === 'extension') {
        return (
          <div className='w-40px h-40px rd-10px bg-[rgba(var(--primary-6),0.08)] flex items-center justify-center shadow-sm'>
            <Puzzle theme='filled' size={20} fill='rgb(var(--primary-6))' />
          </div>
        );
      }
      if (variant === 'auto') {
        return (
          <div className='w-40px h-40px rd-10px bg-[rgba(var(--success-6),0.08)] flex items-center justify-center shadow-sm'>
            <Lightning theme='filled' size={20} fill='rgb(var(--success-6))' />
          </div>
        );
      }
      return (
        <div
          className={`w-40px h-40px rd-10px flex items-center justify-center font-bold text-16px shadow-sm text-transform-uppercase ${getAvatarColorClass(name)}`}
        >
          {name.charAt(0).toUpperCase()}
        </div>
      );
    };

    return (
      <div
        ref={ref}
        data-testid={rest['data-testid']}
        className={`group relative flex flex-col gap-10px p-16px border hover:shadow-sm rd-12px transition-all duration-200 ${highlighted ? 'border-primary-5 bg-primary-1 hover:border-primary-5 hover:bg-primary-1' : 'border-border-1 bg-fill-1 hover:border-border-2 hover:bg-fill-2'}`}
      >
        <div className='flex items-start gap-12px'>
          <div className='shrink-0'>{renderIcon()}</div>
          <div className='flex-1 min-w-0 flex flex-col gap-4px'>
            <h3 className='text-14px font-semibold text-t-primary/90 truncate m-0' title={name}>
              {name}
            </h3>
            {(version || (tags && tags.length > 0)) && (
              <div className='flex flex-wrap gap-6px'>
                {version && <span className={VERSION_CHIP_CLASS}>{version}</span>}
                {tags?.map((tag, index) => (
                  <span key={`${tag}-${index}`} className={TAG_CHIP_CLASS} title={tag}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          {onDelete && (
            <button
              data-testid={deleteTestId}
              className='shrink-0 p-8px hover:bg-danger-1 hover:text-danger-6 text-t-tertiary rd-6px outline-none flex items-center justify-center border border-transparent cursor-pointer transition-colors bg-transparent opacity-100 sm:opacity-0 group-hover:opacity-100'
              onClick={onDelete}
              title={deleteTitle}
            >
              <Delete size={16} />
            </button>
          )}
        </div>
        {description && (
          <p className='text-13px text-t-secondary leading-relaxed line-clamp-2 m-0' title={description}>
            {description}
          </p>
        )}
      </div>
    );
  }
);

SkillCard.displayName = 'SkillCard';

export default SkillCard;
