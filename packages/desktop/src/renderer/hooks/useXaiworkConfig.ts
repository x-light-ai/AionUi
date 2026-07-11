// FORK-CUSTOM: 所有 fork 级别的 UI 开关集中在这里
export function useXaiworkConfig() {
  return {
    hideTeamSection: true, // FORK-CUSTOM: 隐藏团队菜单
    hideModelSettingsMenu: true, // FORK-CUSTOM: 隐藏设置中的 AI 核心 / 模型菜单
    hideAgentSettingsMenu: true, // FORK-CUSTOM: 隐藏设置中的 Agents 菜单
    hideQuickActionButtons: true, // FORK-CUSTOM: 隐藏欢迎页底部的反馈/收藏/WebUI 三个快捷按钮
  };
}
