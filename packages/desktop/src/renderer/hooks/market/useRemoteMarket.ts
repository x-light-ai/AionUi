import { useCallback, useEffect, useMemo, useState } from 'react';
import { ipcBridge } from '@/common';
import { useAdminMarketClient } from './useAdminMarketClient';
import type { Assistant } from '@/common/types/agent/assistantTypes';
import type { MarketItemType, RemoteMarketItem } from './marketClient';

export interface RemoteMarketCard extends RemoteMarketItem {
  installed: boolean;
}

function resolveDownloadUrl(host: string, storagePath: string): string {
  return new URL(storagePath, host.trim() || window.location.origin).toString();
}

export function useRemoteMarket(type: MarketItemType) {
  const { client, enabled, host } = useAdminMarketClient();
  const [items, setItems] = useState<RemoteMarketCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [tags, setTags] = useState<Array<{ id: number; name: string; color?: string }>>([]);
  const [installedSkills, setInstalledSkills] = useState<string[]>([]);
  const [installedAssistants, setInstalledAssistants] = useState<Assistant[]>([]);

  const refreshInstalled = useCallback(async () => {
    if (type === 'skill') {
      const skills = await ipcBridge.fs.listAvailableSkills.invoke();
      setInstalledSkills(skills.map((skill) => skill.name));
      return;
    }

    const assistants = await ipcBridge.assistants.list.invoke();
    setInstalledAssistants(assistants.filter((assistant) => assistant.source === 'user'));
  }, [type]);

  const load = useCallback(async () => {
    if (!client) {
      setItems([]);
      setTags([]);
      setError(host ? '市场地址不可用' : '未配置市场地址');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await refreshInstalled();
      const [page, marketTags] = await Promise.all([
        client.listItems(type, { pageIndex: 1, pageSize: 100 }),
        client.listTags(),
      ]);
      setTags(marketTags);
      setItems((page?.items ?? []).map((item) => ({ ...item, installed: false })));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setItems([]);
      setTags([]);
    } finally {
      setLoading(false);
    }
  }, [client, host, refreshInstalled, type]);

  useEffect(() => {
    void load();
  }, [load]);

  const mergedItems = useMemo(() => {
    if (type === 'skill') {
      const installedSet = new Set(installedSkills);
      return items.map((item) => ({ ...item, installed: installedSet.has(item.name) }));
    }

    const assistantIds = new Set(installedAssistants.map((assistant) => assistant.id));
    return items.map((item) => ({ ...item, installed: assistantIds.has(item.itemKey) }));
  }, [installedAssistants, installedSkills, items, type]);

  const install = useCallback(
    async (item: RemoteMarketItem) => {
      if (!client) {
        throw new Error('未配置市场地址');
      }
      const download = await client.downloadItem(type, item.id);
      const url = resolveDownloadUrl(host, download.storagePath);
      if (type === 'skill') {
        await ipcBridge.fs.importRemoteSkill.invoke({
          url,
          description: item.description,
          version: item.version,
          tags: item.tags,
        });
      } else {
        await ipcBridge.assistants.importRemote.invoke({ url });
      }
      await load();
    },
    [client, host, load, type]
  );

  const remove = useCallback(
    async (item: RemoteMarketItem) => {
      if (type === 'skill') {
        await ipcBridge.fs.deleteSkill.invoke({ skill_name: item.name });
      } else {
        await ipcBridge.assistants.delete.invoke({ id: item.itemKey });
      }
      await load();
    },
    [load, type]
  );

  return {
    items: mergedItems,
    tags,
    loading,
    error,
    enabled,
    host,
    reload: load,
    install,
    remove,
  };
}
