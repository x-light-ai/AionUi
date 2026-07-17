// FORK-CUSTOM: fork-only tests for XAIWork configuration defaults.
/**
 * FORK-CUSTOM: shape guards for xaiwork-only config constants (xaiworkBrand, xaiworkDefaults).
 * @vitest-environment node
 *
 * Shape guards for fork-only config constants. These files are new fork files
 * that many consumers read by key (update source, About links, wechat appCode,
 * default-assistant selection). An upstream merge that silently drops or renames
 * a key would break those consumers without a type error, so we pin the contract.
 */

import { describe, expect, it } from 'vitest';

import { XAIWORK_BRAND } from '@/common/config/xaiworkBrand';
import { XAIWORK_DEFAULTS } from '@/common/config/xaiworkDefaults';

describe('config/xaiworkBrand', () => {
  it('exposes every branding key consumers depend on', () => {
    expect(Object.keys(XAIWORK_BRAND).toSorted()).toEqual(
      [
        'apiHost',
        'appDescription',
        'appName',
        'changelogUrl',
        'contactUrl',
        'helpDocsUrl',
        'officialWebsite',
        'updateRepo',
        'wechatAppCode',
        'wechatLoginMode',
      ].toSorted()
    );
  });

  it('keeps updateRepo as a bare owner/name slug (no scheme)', () => {
    // updateBridge builds a GitHub release feed URL from this slug.
    expect(XAIWORK_BRAND.updateRepo).toMatch(/^[\w.-]+\/[\w.-]+$/);
  });

  it('uses an absolute http(s) apiHost for server-to-server config fetch', () => {
    // AionCore requests {apiHost}/openapi/agent/config server-side, so it must be absolute.
    expect(XAIWORK_BRAND.apiHost).toMatch(/^https?:\/\//);
  });

  it('keeps a non-empty wechat appCode for login attribution', () => {
    expect(XAIWORK_BRAND.wechatAppCode.length).toBeGreaterThan(0);
  });

  it('uses absolute https URLs when optional outbound links are configured', () => {
    for (const url of [
      XAIWORK_BRAND.helpDocsUrl,
      XAIWORK_BRAND.changelogUrl,
      XAIWORK_BRAND.officialWebsite,
      XAIWORK_BRAND.contactUrl,
    ]) {
      expect(url === '' || url.startsWith('https://')).toBe(true);
    }
  });
});

describe('config/xaiworkDefaults', () => {
  it('exposes the default-assistant selection keys', () => {
    expect(Object.keys(XAIWORK_DEFAULTS).toSorted()).toEqual(
      ['defaultAssistantBackend', 'defaultAssistantId'].toSorted()
    );
  });

  it('uses null or a non-empty string for each default (never empty string)', () => {
    // pickDefaultAssistantSelectionKey treats '' as "no match"; an empty string
    // would be a footgun, so the config must be null when unset.
    for (const value of [XAIWORK_DEFAULTS.defaultAssistantBackend, XAIWORK_DEFAULTS.defaultAssistantId]) {
      expect(value === null || (typeof value === 'string' && value.length > 0)).toBe(true);
    }
  });

  it('defaults new assistant selections to Codex', () => {
    expect(XAIWORK_DEFAULTS.defaultAssistantBackend).toBe('codex');
  });
});
