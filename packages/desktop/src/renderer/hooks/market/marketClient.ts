// FORK-CUSTOM: keep this dependency outside renderer/api to avoid Vite dev-server
// resolving it under /api/* and colliding with backend routes.
import { createApiClient } from './httpClient';

export type MarketItemType = 'skill' | 'assistant';

export interface RemoteMarketItem {
  id: number;
  itemType: number;
  itemKey: string;
  name: string;
  version: string;
  description: string;
  iconText: string;
  packageUrl: string;
  downloadCount: number;
  status: number;
  sortOrder: number;
  tagIds: number[];
  tags: string[];
}

export interface RemoteMarketPageResult<T> {
  items: T[];
  totalItems: number;
}

// XHub backend wraps every response in { traceId, data, success }. Unwrap to the
// business payload so callers receive the raw data instead of the envelope.
interface XHubResponse<T> {
  data: T;
  success: boolean;
  traceId?: string;
}

function unwrap<T>(res: XHubResponse<T>): T {
  return res.data;
}

export interface RemoteMarketQuery {
  keyword?: string;
  pageIndex?: number;
  pageSize?: number;
  tagId?: number;
  status?: number;
}

function normalizeHost(host: string) {
  return host.endsWith('/') ? host.slice(0, -1) : host;
}

export function createMarketClient(host: string) {
  const api = createApiClient(normalizeHost(host));

  const getBase = (type: MarketItemType) => `/openapi/market/${type}`;

  return {
    listItems(type: MarketItemType, query: RemoteMarketQuery) {
      return api
        .post<XHubResponse<RemoteMarketPageResult<RemoteMarketItem>>>(`${getBase(type)}/pagelist`, query)
        .then(unwrap);
    },
    getItemDetail(type: MarketItemType, id: number | string) {
      return api.post<XHubResponse<RemoteMarketItem>>(`${getBase(type)}/detail/${id}`).then(unwrap);
    },
    downloadItem(type: MarketItemType, id: number | string) {
      return api.post<XHubResponse<{ packageUrl: string }>>(`${getBase(type)}/download`, { id }).then(unwrap);
    },
    listTags() {
      return api
        .post<XHubResponse<Array<{ id: number; name: string; color?: string }>>>('/openapi/market/tag/options')
        .then(unwrap);
    },
  };
}
