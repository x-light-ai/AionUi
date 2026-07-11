// FORK-CUSTOM: fork-only metadata overlay for XAIWork-installed Skills.
import type { XaiworkInstalledSkillMetadata } from '@/common/adapter/xaiworkBridge';

export type { XaiworkInstalledSkillMetadata } from '@/common/adapter/xaiworkBridge';

interface SkillMetadataTarget {
  name: string;
  description: string;
  version?: string;
  tags?: string[];
  source?: string;
}

export const mergeXaiworkSkillMetadata = <T extends SkillMetadataTarget>(
  skills: T[],
  metadata: XaiworkInstalledSkillMetadata[]
): T[] => {
  const metadataByName = new Map(metadata.map((item) => [item.name, item]));

  return skills.flatMap((skill) => {
    if (skill.source !== 'custom') return [skill];

    const item = metadataByName.get(skill.name);
    if (!item) return [skill];
    if (item.visibility === 'dependency') return [];

    return [
      {
        ...skill,
        description: item.description ?? skill.description,
        version: item.version ?? skill.version,
        tags: item.tags,
      },
    ];
  });
};
