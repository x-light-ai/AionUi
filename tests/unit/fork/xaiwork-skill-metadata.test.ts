// FORK-CUSTOM: fork-only tests for the XAIWork Skill metadata overlay.
import { describe, expect, it } from 'vitest';

import {
  mergeXaiworkSkillMetadata,
  type XaiworkInstalledSkillMetadata,
} from '@renderer/pages/settings/xaiworkSkillMetadata';

const metadata = (overrides: Partial<XaiworkInstalledSkillMetadata> = {}): XaiworkInstalledSkillMetadata => ({
  name: 'demo',
  description: null,
  version: null,
  tags: [],
  source: 'assistant-bundle',
  visibility: 'dependency',
  assistant_ids: ['assistant-1'],
  ...overrides,
});

describe('mergeXaiworkSkillMetadata', () => {
  it('hides assistant dependencies without hiding a same-name builtin', () => {
    const skills = [
      { name: 'demo', description: 'user copy', source: 'custom' },
      { name: 'demo', description: 'builtin copy', source: 'builtin' },
    ];

    expect(mergeXaiworkSkillMetadata(skills, [metadata()])).toEqual([skills[1]]);
  });

  it('merges market presentation metadata into user-owned skills', () => {
    const result = mergeXaiworkSkillMetadata(
      [{ name: 'demo', description: 'manifest description', source: 'custom' }],
      [
        metadata({
          description: 'market description',
          version: '1.2.3',
          tags: ['office'],
          source: 'market',
          visibility: 'user',
        }),
      ]
    );

    expect(result).toEqual([
      {
        name: 'demo',
        description: 'market description',
        source: 'custom',
        version: '1.2.3',
        tags: ['office'],
      },
    ]);
  });

  it('leaves skills without Core metadata unchanged', () => {
    const skills = [{ name: 'local', description: 'local import', source: 'custom' }];
    expect(mergeXaiworkSkillMetadata(skills, [])).toEqual(skills);
  });
});
