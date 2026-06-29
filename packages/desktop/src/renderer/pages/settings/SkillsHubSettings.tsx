import { ipcBridge } from '@/common';
import { Message, Modal } from '@arco-design/web-react';
import { FolderOpen, Info, Puzzle, Search, Refresh } from '@icon-park/react';
import React, { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router-dom';
import SettingsPageWrapper from './components/SettingsPageWrapper';
import SkillCard, { type SkillCardVariant } from './components/SkillCard';

// Skill 信息类型 / Skill info type
interface SkillInfo {
  name: string;
  description: string;
  location: string;
  /**
   * Relative location under the builtin-skills corpus (e.g.
   * `auto-inject/cron/SKILL.md`). Present only for `source=builtin`; the
   * export-to-external-source flow still uses absolute `location` paths.
   */
  relative_location?: string;
  version?: string;
  tags?: string[];
  is_custom: boolean;
  source?: 'builtin' | 'custom' | 'cron' | 'extension';
}

// Normalize skill name for data-testid usage
const normalizeTestId = (name: string): string => {
  return name.replace(/[:/\s<>"'|?*]/g, '-');
};

// Responsive card grid shared by all skill groups.
const SKILL_GRID_CLASS = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-12px relative z-10';

interface SkillsHubSettingsProps {
  /** When false, renders without SettingsPageWrapper — useful for embedding in a tab */
  withWrapper?: boolean;
}

const SkillsHubSettings: React.FC<SkillsHubSettingsProps> = ({ withWrapper = true }) => {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightName = searchParams.get('highlight');
  const [highlightedSkill, setHighlightedSkill] = useState<string | null>(null);
  const skillRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [loading, setLoading] = useState(false);
  const [availableSkills, setAvailableSkills] = useState<SkillInfo[]>([]);
  const [skillPaths, setSkillPaths] = useState<{ user_skills_dir: string; builtin_skills_dir: string } | null>(null);
  const [search_query, setSearchQuery] = useState('');

  const mySkills = useMemo(() => availableSkills.filter((s) => s.source !== 'extension'), [availableSkills]);
  const extensionSkills = useMemo(() => availableSkills.filter((s) => s.source === 'extension'), [availableSkills]);

  const filteredSkills = useMemo(() => {
    if (!search_query.trim()) return mySkills;
    const lowerQuery = search_query.toLowerCase();
    return mySkills.filter(
      (s) =>
        s.name.toLowerCase().includes(lowerQuery) || (s.description && s.description.toLowerCase().includes(lowerQuery))
    );
  }, [mySkills, search_query]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const skills = await ipcBridge.fs.listAvailableSkills.invoke();
      setAvailableSkills(skills);

      const paths = await ipcBridge.fs.getSkillPaths.invoke();
      setSkillPaths(paths);
    } catch (error) {
      console.error('Failed to fetch skills:', error);
      Message.error(t('settings.skillsHub.fetchError', { defaultValue: 'Failed to fetch skills' }));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  // Scroll to and highlight a skill when navigated with ?highlight=skillName
  useEffect(() => {
    if (!highlightName || loading) return;
    const el = skillRefs.current[highlightName];
    if (el) {
      // Small delay to ensure layout is settled
      requestAnimationFrame(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setHighlightedSkill(highlightName);
        // Clear highlight after animation
        const timer = setTimeout(() => setHighlightedSkill(null), 2000);
        // Clean up the search param so refreshing won't re-highlight
        setSearchParams({}, { replace: true });
        return () => clearTimeout(timer);
      });
    }
  }, [highlightName, loading, availableSkills, setSearchParams]);

  const handleImport = async (skillPath: string) => {
    try {
      const result = await ipcBridge.fs.importSkillWithSymlink.invoke({ skill_path: skillPath });
      const importedNames = result.skill_names?.length
        ? result.skill_names
        : result.skill_name
          ? [result.skill_name]
          : [];
      const count = importedNames.length;
      const names = importedNames.join(', ');
      Message.success(
        t('settings.skillsHub.importSuccessDetailed', {
          count,
          names,
          defaultValue: count > 1 ? `Imported ${count} skills: ${names}` : `Imported skill: ${names}`,
        })
      );
      setSearchQuery('');
      void fetchData();
    } catch (error) {
      console.error('Failed to import skill:', error);
      Message.error(t('settings.skillsHub.importError', { defaultValue: 'Error importing skill' }));
    }
  };

  const handleDelete = async (skillName: string) => {
    try {
      await ipcBridge.fs.deleteSkill.invoke({ skill_name: skillName });
      Message.success(t('settings.skillsHub.deleteSuccess', { defaultValue: 'Skill deleted' }));
      void fetchData();
    } catch (error) {
      console.error('Failed to delete skill:', error);
      Message.error(t('settings.skillsHub.deleteError', { defaultValue: 'Error deleting skill' }));
    }
  };

  const handleManualImport = async () => {
    try {
      const result = await ipcBridge.dialog.showOpen.invoke({
        properties: ['openFile', 'openDirectory'],
        filters: [{ name: 'Skill folders or zip archives', extensions: ['zip'] }],
      });
      if (result && result.length > 0) {
        await handleImport(result[0]);
      }
    } catch (error) {
      console.error('Failed to open directory dialog:', error);
    }
  };

  const confirmDelete = (skillName: string) => {
    Modal.confirm({
      title: t('settings.skillsHub.deleteConfirmTitle', { defaultValue: 'Delete Skill' }),
      content: t('settings.skillsHub.deleteConfirmContent', {
        name: skillName,
        defaultValue: `Are you sure you want to delete "${skillName}"?`,
      }),
      okButtonProps: { status: 'danger' },
      okText: t('common.delete', { defaultValue: 'Delete' }),
      onOk: () => void handleDelete(skillName),
      wrapClassName: 'modal-delete-skill',
    });
  };

  const setSkillRef = (name: string) => (el: HTMLDivElement | null) => {
    skillRefs.current[name] = el;
  };

  const mainContent = (
    <div className='flex flex-col h-full w-full'>
      <div className='space-y-16px pb-24px'>
        {/* ======== 我的技能 / My Skills ======== */}
        <div
          data-testid='my-skills-section'
          className='px-[16px] md:px-[32px] py-32px bg-base rd-16px md:rd-24px shadow-sm border border-b-base relative overflow-hidden transition-all'
        >
          {/* Toolbar for My Skills */}
          <div className='flex items-center justify-between gap-16px mb-16px relative z-10'>
            <div className='flex items-center gap-10px shrink-0'>
              <span className='text-16px md:text-18px text-t-primary font-bold tracking-tight'>
                {t('settings.skillsHub.mySkillsTitle', { defaultValue: 'My Skills' })}
              </span>
              <span className='bg-[rgba(var(--primary-6),0.08)] text-primary-6 text-12px px-10px py-2px rd-[100px] font-medium ml-4px'>
                {mySkills.length}
              </span>
            </div>

            <div className='flex items-center gap-12px shrink-0'>
              <button
                data-testid='btn-manual-import'
                className='flex items-center justify-center gap-6px px-16px py-6px bg-base border border-border-1 hover:border-border-2 hover:bg-fill-1 text-t-primary rd-8px shadow-sm transition-all focus:outline-none shrink-0 cursor-pointer whitespace-nowrap'
                onClick={handleManualImport}
              >
                <FolderOpen size={15} className='text-t-secondary' />
                <span className='text-13px font-medium'>
                  {t('settings.skillsHub.manualImport', { defaultValue: 'Import Skills' })}
                </span>
              </button>
              <button
                data-testid='btn-refresh-my-skills'
                className='outline-none border-none bg-transparent cursor-pointer p-6px text-t-tertiary hover:text-primary-6 transition-colors rd-full hover:bg-fill-2'
                onClick={async () => {
                  await fetchData();
                  Message.success(t('common.refreshSuccess', { defaultValue: 'Refreshed' }));
                }}
                title={t('common.refresh', { defaultValue: 'Refresh' })}
              >
                <Refresh theme='outline' size={16} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Search row */}
          <div className='relative group w-full mb-16px relative z-10'>
            <div className='absolute left-12px top-1/2 -translate-y-1/2 text-t-tertiary group-focus-within:text-primary-6 flex pointer-events-none transition-colors'>
              <Search size={15} />
            </div>
            <input
              data-testid='input-search-my-skills'
              type='text'
              className='w-full bg-fill-1 hover:bg-fill-2 border border-border-1 focus:border-primary-5 focus:bg-base outline-none rd-8px py-6px pl-36px pr-12px text-13px text-t-primary placeholder:text-t-tertiary transition-all shadow-sm box-border m-0'
              placeholder={t('settings.skillsHub.searchPlaceholder', { defaultValue: 'Search skills...' })}
              value={search_query}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Path Display */}
          {skillPaths && (
            <div className='flex items-center gap-8px text-12px text-t-tertiary font-mono bg-transparent py-4px mb-16px relative z-10 pt-4px border-t border-t-transparent'>
              <FolderOpen size={16} className='shrink-0' />
              <span className='truncate' title={skillPaths.user_skills_dir}>
                {skillPaths.user_skills_dir}
              </span>
            </div>
          )}

          {mySkills.length > 0 ? (
            <div className={SKILL_GRID_CLASS}>
              {filteredSkills.map((skill) => {
                const variant: SkillCardVariant = skill.source === 'custom' ? 'custom' : 'builtin';
                return (
                  <SkillCard
                    key={skill.name}
                    ref={setSkillRef(skill.name)}
                    data-testid={`my-skill-card-${normalizeTestId(skill.name)}`}
                    name={skill.name}
                    description={skill.description}
                    variant={variant}
                    version={skill.version}
                    tags={skill.tags}
                    highlighted={highlightedSkill === skill.name}
                    onDelete={() => confirmDelete(skill.name)}
                    deleteTitle={t('common.delete', { defaultValue: 'Delete' })}
                    deleteTestId={`btn-delete-${normalizeTestId(skill.name)}`}
                  />
                );
              })}
            </div>
          ) : (
            <div className='text-center text-t-secondary text-13px py-40px bg-fill-1 rd-12px border border-b-base border-dashed relative z-10'>
              {loading
                ? t('common.loading', { defaultValue: 'Please wait...' })
                : t('settings.skillsHub.noSkills', {
                    defaultValue: 'No skills found. Import some to get started.',
                  })}
            </div>
          )}
        </div>

        {/* ======== Extension Skills ======== */}
        {extensionSkills.length > 0 && (
          <div
            data-testid='extension-skills-section'
            className='px-[16px] md:px-[32px] py-32px bg-base rd-16px md:rd-24px shadow-sm border border-b-base relative overflow-hidden transition-all'
          >
            <div className='flex items-center gap-10px mb-24px'>
              <Puzzle theme='filled' size={20} fill='var(--color-primary-6)' />
              <span className='text-16px md:text-18px text-t-primary font-bold tracking-tight'>
                {t('settings.extensionSkills', { defaultValue: 'Extension Skills' })}
              </span>
              <span className='bg-[rgba(var(--primary-6),0.08)] text-primary-6 text-12px px-10px py-2px rd-[100px] font-medium ml-4px'>
                {extensionSkills.length}
              </span>
            </div>
            <div className={SKILL_GRID_CLASS}>
              {extensionSkills.map((skill) => (
                <SkillCard
                  key={skill.name}
                  ref={setSkillRef(skill.name)}
                  name={skill.name}
                  description={skill.description}
                  variant='extension'
                  version={skill.version}
                  tags={skill.tags}
                  highlighted={highlightedSkill === skill.name}
                />
              ))}
            </div>
          </div>
        )}

        {/* ======== Usage Tip ======== */}
        <div className='px-16px md:px-[24px] py-20px bg-base border border-b-base shadow-sm rd-16px flex items-start gap-12px text-t-secondary'>
          <Info size={18} className='text-primary-6 mt-2px shrink-0' />
          <div className='flex flex-col gap-4px'>
            <span className='font-bold text-t-primary text-14px'>
              {t('settings.skillsHub.tipTitle', { defaultValue: 'Usage Tip:' })}
            </span>
            <span className='text-13px leading-relaxed'>{t('settings.skillsHub.tipContent')}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return withWrapper ? <SettingsPageWrapper>{mainContent}</SettingsPageWrapper> : mainContent;
};

export default SkillsHubSettings;
