// FORK-CUSTOM: fork-only hook that binds the XAIWork admin market client to authentication.
import { useMemo } from 'react';
import { useConfig } from '@/renderer/hooks/config/useConfig';
import { createMarketClient } from './marketClient';

const DEFAULT_ADMIN_MARKET_HOST = '';

export function useAdminMarketClient() {
  const [host] = useConfig('xaiwork.adminApiHost');
  const effectiveHost = host?.trim() || DEFAULT_ADMIN_MARKET_HOST;

  const client = useMemo(() => createMarketClient(effectiveHost), [effectiveHost]);

  return {
    host: effectiveHost,
    client,
    enabled: true,
  };
}
