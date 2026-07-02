/**
 * FORK-CUSTOM: shape guards for fork-only config constants (forkBrand, forkDefaults).
 * @vitest-environment node
 *
 * Shape guards for fork-only config constants. These files are new fork files
 * that many consumers read by key (update source, About links, wechat appCode,
 * default-assistant selection). An upstream merge that silently drops or renames
 * a key would break those consumers without a type error, so we pin the contract.
 */

import { describe, expect, it } from 'vitest';

import { FORK_BRAND } from '@/common/config/forkBrand';
import { FORK_DEFAULTS } from '@/common/config/forkDefaults';

describe('config/forkBrand', () => {
  it('exposes every branding key consumers depend on', () => {
    expect(Object.keys(FORK_BRAND).sort()).toEqual(
      [
        'appName',
        'changelogUrl',
        'contactUrl',
        'helpDocsUrl',
        'officialWebsite',
        'repoUrl',
        'updateRepo',
        'wechatAppCode',
      ].sort()
    );
  });

  it('keeps updateRepo as a bare owner/name slug (no scheme)', () => {
    // updateBridge builds a GitHub release feed URL from this slug.
    expect(FORK_BRAND.updateRepo).toMatch(/^[\w.-]+\/[\w.-]+$/);
  });

  it('keeps a non-empty wechat appCode for login attribution', () => {
    expect(FORK_BRAND.wechatAppCode.length).toBeGreaterThan(0);
  });

  it('uses absolute https URLs for outbound links', () => {
    for (const url of [
      FORK_BRAND.repoUrl,
      FORK_BRAND.helpDocsUrl,
      FORK_BRAND.changelogUrl,
      FORK_BRAND.officialWebsite,
      FORK_BRAND.contactUrl,
    ]) {
      expect(url).toMatch(/^https:\/\//);
    }
  });
});

describe('config/forkDefaults', () => {
  it('exposes the default-assistant selection keys', () => {
    expect(Object.keys(FORK_DEFAULTS).sort()).toEqual(['defaultAssistantBackend', 'defaultAssistantId'].sort());
  });

  it('uses null or a non-empty string for each default (never empty string)', () => {
    // pickDefaultAssistantSelectionKey treats '' as "no match"; an empty string
    // would be a footgun, so the config must be null when unset.
    for (const value of [FORK_DEFAULTS.defaultAssistantBackend, FORK_DEFAULTS.defaultAssistantId]) {
      expect(value === null || (typeof value === 'string' && value.length > 0)).toBe(true);
    }
  });
});
