/**
 * @vitest-environment node
 *
 * createMarketClient builds XAIWork market endpoint calls on top of the shared
 * httpClient and unwraps the XHub { data, success } envelope.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

const { postMock, createApiClientMock } = vi.hoisted(() => {
  const postMock = vi.fn();
  return { postMock, createApiClientMock: vi.fn(() => ({ post: postMock })) };
});

vi.mock('@renderer/hooks/market/httpClient', () => ({
  createApiClient: (host: string) => createApiClientMock(host),
}));

import { createMarketClient } from '@renderer/hooks/market/marketClient';

describe('market/marketClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('strips a trailing slash from the host', () => {
    createMarketClient('https://api.xaiwork.com/');
    expect(createApiClientMock).toHaveBeenCalledWith('https://api.xaiwork.com');
  });

  it('posts skill/assistant pagelist and unwraps the XHub envelope', async () => {
    const page = { items: [{ id: 1 }], totalItems: 1 };
    postMock.mockResolvedValue({ success: true, data: page });

    const client = createMarketClient('https://api.xaiwork.com');
    const result = await client.listItems('skill', { keyword: 'x', pageIndex: 1, pageSize: 20 });

    expect(postMock).toHaveBeenCalledWith('/openapi/market/skill/pagelist', {
      keyword: 'x',
      pageIndex: 1,
      pageSize: 20,
    });
    expect(result).toBe(page);
  });

  it('routes detail and download to the item-type base path', async () => {
    postMock.mockResolvedValue({ success: true, data: { storagePath: 'p' } });

    const client = createMarketClient('https://api.xaiwork.com');
    await client.getItemDetail('assistant', 42);
    await client.downloadItem('assistant', 42);

    expect(postMock).toHaveBeenNthCalledWith(1, '/openapi/market/assistant/detail/42');
    expect(postMock).toHaveBeenNthCalledWith(2, '/openapi/market/assistant/download', { id: 42 });
  });

  it('lists tag options from the shared tag endpoint', async () => {
    postMock.mockResolvedValue({ success: true, data: [{ id: 1, name: 'ai' }] });

    const client = createMarketClient('https://api.xaiwork.com');
    const tags = await client.listTags();

    expect(postMock).toHaveBeenCalledWith('/openapi/market/tag/options');
    expect(tags).toEqual([{ id: 1, name: 'ai' }]);
  });
});
