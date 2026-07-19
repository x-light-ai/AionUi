// FORK-CUSTOM: fork-only tests for XAIWork brand configuration.
/**
 * FORK-CUSTOM: shape guards for XAIWork-only brand constants.
 * @vitest-environment node
 *
 * Shape guards for fork-only brand constants. An upstream merge that silently
 * drops or renames a key would break consumers without a type error, so we pin
 * the contract.
 */

import { describe, expect, it } from 'vitest';

import { XAIWORK_BRAND } from '@/common/config/xaiworkBrand';

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
