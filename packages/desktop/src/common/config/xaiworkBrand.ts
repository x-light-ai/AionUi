// FORK-CUSTOM: 所有需要与上游不同的品牌/链接配置集中在此文件
// 合并上游代码时，此文件不会产生冲突（新增文件）

export const XAIWORK_BRAND = {
  appName: 'XAIWork', // 应用名称
  appDescription: '不只是聊天，能帮你把事做成', // 关于页品牌标语（替换上游 settings.appDescription）
  helpDocsUrl: '', // 帮助文档
  changelogUrl: '', // 更新日志
  officialWebsite: '', // 官网
  contactUrl: '', // 联系方式
  updateRepo: 'iOfficeAI/AionUi', // 自动更新来源（GitHub repo）
  wechatAppCode: 'xaiwork', // 微信扫码登录时上报的 app 来源编码，XAIWork 据此建立会员-app 关联
  // 微信登录模式（登录页在鉴权前运行，用构建期配置而非运行时 UI 设置）：
  //   'sa'          = 公众号(服务号)扫码：后端 SAAuth 直接返回可显示的二维码图片 URL，前端 <img> 展示；
  //   'miniprogram' = 小程序扫码：后端 MiniProgramAuth 返回二维码内容文本，前端自行生成二维码图片。
  wechatLoginMode: 'miniprogram' as 'sa' | 'miniprogram',
};
