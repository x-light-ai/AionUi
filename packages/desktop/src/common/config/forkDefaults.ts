// FORK-CUSTOM: fork 行为默认值集中配置（新建文件，合并上游不会冲突）
//
// 此文件集中存放所有"上游有默认逻辑，fork 想覆盖为具体值"的配置。
// 与 forkBrand.ts 关注点分离：forkBrand 是品牌/链接，本文件是行为默认值。

export const FORK_DEFAULTS = {
  /**
   * 推荐方式：按 agent backend 指定默认助手（稳定可移植）。
   *
   * 匹配 `assistant.agent.acp_backend`（或 `assistant.agent.type` 作回退）。
   * 该值是上游约定的稳定字符串（如 'claude' / 'openai' / 'gemini' / 'codex' / 'aionrs'），
   * 不随设备/安装变化，跨用户可复用。
   *
   * - null：不按 backend 匹配
   * - 'claude'：默认选 Claude Code 助手
   * - 'codex'：默认选 Codex CLI 助手
   * - 'aionrs'：默认选 Aion CLI 助手
   * - 'gemini'
   * 匹配时遍历 enabled 助手，优先在 builtin/user 中找，找不到再去 generated 找。
   */
  defaultAssistantBackend: 'claude' as string | null,

  /**
   * 备用方式：按 assistant.id 精确指定（机器特定，不可移植）。
   *
   * 仅当 `defaultAssistantBackend` 没匹配到时才会尝试此项。
   * 注意：generated 助手的 ID 是随机短哈希（如 'bare:2d23ff1c'），
   * 不同设备/重装会变，**不建议**用于跨用户分发。
   *
   * - null：不按 ID 匹配
   * - 'custom-1719724800000-a1b2c3'：精确指定某个用户助手
   */
  defaultAssistantId: null as string | null,
};
