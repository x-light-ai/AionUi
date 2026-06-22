/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

// FORK-CUSTOM: Bottom-toolbar skill selector for the guid (new conversation) page.
// Replaces the skill submenu that used to live inside the "+" file menu. Clicking
// a skill selects it as the only skill for this conversation, fills `/skill-name`
// into the input, and closes the popover.

import { iconColors } from '@/renderer/styles/colors';
import { Popover } from '@arco-design/web-react';
import { Lightning } from '@icon-park/react';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

export type GuidSkillItem = { name: string; description: string; isAuto: boolean };

type GuidSkillSelectorProps = {
  skills: GuidSkillItem[];
  /** Click a skill — selects it as the only skill and fills the input. */
  onSelectSkill: (skill: GuidSkillItem) => void;
  /** Total number of available local skills — shown on the trigger badge. */
  totalCount: number;
};

const GuidSkillSelector: React.FC<GuidSkillSelectorProps> = ({ skills, onSelectSkill, totalCount }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const content = (
    <div className='w-280px max-h-360px overflow-y-auto'>
      <div className='text-12px font-500 text-t-secondary px-8px pt-4px pb-8px'>
        {t('guid.skillSelector.title', { defaultValue: 'Skills' })}
      </div>
      {skills.length === 0 ? (
        <div className='flex flex-col items-center gap-8px py-24px px-12px text-center'>
          <span className='text-13px text-t-secondary'>
            {t('guid.skillSelector.empty', { defaultValue: 'No skills available' })}
          </span>
          <button
            type='button'
            className='text-13px text-primary-6 bg-transparent border-none cursor-pointer outline-none hover:underline'
            onClick={() => {
              setOpen(false);
              void navigate('/settings/capabilities?tab=market');
            }}
          >
            {t('guid.skillSelector.goToMarket', { defaultValue: 'Go to Skill Market' })}
          </button>
        </div>
      ) : (
        <div className='flex flex-col gap-2px'>
          {skills.map((skill) => (
            <button
              type='button'
              key={skill.name}
              data-testid={`guid-skill-${skill.name.replace(/[:/\s<>"'|?*]/g, '-')}`}
              className='flex items-start gap-10px py-8px px-8px rounded-6px cursor-pointer text-left border-none outline-none transition-colors w-full bg-transparent hover:bg-fill-2'
              onClick={() => {
                onSelectSkill(skill);
                setOpen(false);
              }}
            >
              <Lightning
                theme='outline'
                size={16}
                fill={iconColors.primary}
                strokeWidth={2.5}
                style={{ lineHeight: 0, marginTop: 2 }}
              />
              <span className='flex-1 min-w-0 flex flex-col gap-2px'>
                <span className='text-13px text-t-primary font-500 truncate'>{skill.name}</span>
                {skill.description && (
                  <span className='text-12px text-t-secondary leading-snug line-clamp-2'>{skill.description}</span>
                )}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <Popover content={content} trigger='click' position='bl' popupVisible={open} onVisibleChange={setOpen}>
      <span
        className='inline-flex items-center gap-4px rounded-full px-10px py-3px cursor-pointer text-t-secondary hover:text-t-primary transition-colors lh-[1]'
        data-testid='guid-skill-selector-trigger'
      >
        <Lightning theme='outline' size={14} fill='currentColor' strokeWidth={2} style={{ lineHeight: 0 }} />
        <span className='text-13px'>
          {t('settings.capabilitiesTab.skills', { defaultValue: 'Skills' })}
          {totalCount > 0 ? ` (${totalCount})` : ''}
        </span>
      </span>
    </Popover>
  );
};

export default GuidSkillSelector;
