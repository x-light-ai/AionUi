// FORK-CUSTOM: 所有 fork 级别的 UI 开关集中在这里
export function useForkConfig() {
  return {
    hideTeamSection: true, // FORK-CUSTOM: 隐藏团队菜单
    hideModelSettingsMenu: true, // FORK-CUSTOM: 隐藏设置中的 AI 核心 / 模型菜单
  };
}
