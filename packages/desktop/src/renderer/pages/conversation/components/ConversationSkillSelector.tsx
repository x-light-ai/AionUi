/**
 * @license
 * Copyright 2025 AionUi (aionui.com)
 * SPDX-License-Identifier: Apache-2.0
 */

// FORK-CUSTOM: Mirror of the guid (new conversation) skill selector for the
// in-conversation send box. Loads the full available skill catalog
// (builtin auto-inject + user-imported) so users can quickly inject
// `/skill-name` into the input, matching the new-conversation flow.

import { ipcBridge } from '@/common';
import { iconColors } from '@/renderer/styles/colors';
import { Popover } from '@arco-design/web-react';
import { Lightning } from '@icon-park/react';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

type SkillItem = { name: string; description: string; isAuto: boolean };

type ConversationSkillSelectorProps = {
  onSelectSkill: (name: string) => void;
};

const ConversationSkillSelector: React.FC<ConversationSkillSelectorProps> = ({ onSelectSkill }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [skills, setSkills] = useState<SkillItem[]>([]);

  useEffect(() => {
    ipcBridge.fs.listAvailableSkills
      .invoke()
      .then((availableSkills) => {
        const merged: SkillItem[] = availableSkills.map((s) => ({
          name: s.name,
          description: s.description,
          isAuto: s.is_auto_inject === true,
        }));
        setSkills(merged);
      })
      .catch(() => setSkills([]));
  }, []);

  const totalCount = skills.length;

  const content = (
    <div className='w-280px max-h-360px overflow-y-auto'>
      <div className='text-12px font-500 text-t-secondary px-8px pt-4px pb-8px'>
        {t('xaiwork.skillSelector.title', { defaultValue: 'Skills' })}
      </div>
      {skills.length === 0 ? (
        <div className='flex flex-col items-center gap-8px py-24px px-12px text-center'>
          <span className='text-13px text-t-secondary'>
            {t('xaiwork.skillSelector.empty', { defaultValue: 'No skills available' })}
          </span>
          <button
            type='button'
            className='text-13px text-primary-6 bg-transparent border-none cursor-pointer outline-none hover:underline'
            onClick={() => {
              setOpen(false);
              void navigate('/settings/capabilities?tab=market');
            }}
          >
            {t('xaiwork.skillSelector.goToMarket', { defaultValue: 'Go to Skill Market' })}
          </button>
        </div>
      ) : (
        <div className='flex flex-col gap-2px'>
          {skills.map((skill) => (
            <button
              type='button'
              key={skill.name}
              data-testid={`conversation-skill-${skill.name.replace(/[:/\s<>"'|?*]/g, '-')}`}
              className='flex items-start gap-10px py-8px px-8px rounded-6px cursor-pointer text-left border-none outline-none transition-colors w-full bg-transparent hover:bg-fill-2'
              onClick={() => {
                onSelectSkill(skill.name);
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

  if (totalCount === 0) return null;

  return (
    <Popover content={content} trigger='click' position='tl' popupVisible={open} onVisibleChange={setOpen}>
      <span
        className='inline-flex items-center gap-4px rounded-full px-10px py-3px cursor-pointer text-t-secondary hover:text-t-primary transition-colors lh-[1]'
        data-testid='conversation-skill-selector-trigger'
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

export default ConversationSkillSelector;
