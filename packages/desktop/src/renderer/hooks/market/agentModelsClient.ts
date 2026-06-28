// FORK-CUSTOM: XAIWork agent model distribution client. Keep outside
// renderer/api to avoid the Vite dev-server resolving it under /api/* and
// colliding with AionCore backend routes (same reason as marketClient).
import { createApiClient } from './httpClient';

/** One distributed model for a builtin agent, as defined on XAIWork. */
export interface XaiworkAgentModel {
  modelId: string;
  name: string;
  baseUrl: string;
  /** Sensitive relay credential — never log or render. */
  apiKey: string;
  /** Model-level CLI config JSON (e.g. ~/.claude/settings.json contents). */
  configJson?: string;
}

// XHub backend wraps every response in { traceId, data, success }. Unwrap to
// the business payload so callers receive the raw list.
interface XHubResponse<T> {
  data: T;
  success: boolean;
  traceId?: string;
}

function unwrap<T>(res: XHubResponse<T>): T {
  return res.data;
}

function normalizeHost(host: string) {
  return host.endsWith('/') ? host.slice(0, -1) : host;
}

export function createAgentModelsClient(host: string) {
  const api = createApiClient(normalizeHost(host));
  return {
    /** Fetch the models a builtin agent (claude / codex) may use, each with its config_json. */
    listModels(backend: string) {
      return api.post<XHubResponse<XaiworkAgentModel[]>>('/openapi/agent/models', { backend }).then(unwrap);
    },
  };
}
