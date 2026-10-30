// NCode 关闭项锚点登记：单一事实源，供锚点测试与影响映射脚本共同消费。
// 数据与 ncode-feature.md「一、关闭功能」对应（docs/ncode-closure-regression.spec.md）。
// 上游更新命中锚点时，失败信息指向对应关闭项；锚点文件移动或改名时沿当前调用链
// 更新登记，不得删锚点放宽。

/** 锚点类型：require 断言关闭接线仍在；forbid 断言已移除入口未回流。 */
export const NCODE_CLOSURE_ANCHORS = [
  // 客户端远程配置（2026-10-23）
  {
    section: "一、关闭功能 · 客户端远程配置",
    kind: "require",
    file: "packages/services/src/client-config/clientConfigService.ts",
    pattern: /NCODE_FEATURE_POLICY\.remoteClientConfigs/,
  },
  {
    section: "一、关闭功能 · 客户端远程配置",
    kind: "require",
    file: "packages/services/src/client-config/clientConfigService.ts",
    pattern: /NCODE_FEATURE_POLICY\.clientConfigDefaults/,
  },
  {
    section: "一、关闭功能 · 客户端远程配置（场景推荐）",
    kind: "require",
    file: "packages/services/src/client-scenes/clientScenesService.ts",
    pattern: /NCODE_FEATURE_POLICY\.clientScenes/,
  },
  // 1. 官方账号、套餐与权益
  {
    section: "一、关闭功能 · 1 官方账号、套餐与权益",
    kind: "require",
    file: "packages/ui/src/settings/ModelProviderSection.tsx",
    pattern: /NCODE_FEATURE_POLICY\.officialAccountQueries/,
    note: "模型设置停用套餐专属查询",
  },
  {
    section: "一、关闭功能 · 1 官方账号、套餐与权益",
    kind: "require",
    file: "packages/ui/src/SettingsPage.tsx",
    pattern: /NCODE_FEATURE_POLICY\.officialAccountQueries/,
  },
  {
    section: "一、关闭功能 · 1 官方账号、套餐与权益",
    kind: "require",
    file: "packages/ui/src/WorkspaceSidebarFooter.tsx",
    pattern: /NCODE_FEATURE_POLICY\.officialAccountQueries/,
    note: "侧边栏不恢复官方额度查询",
  },
  {
    section: "一、关闭功能 · 1 官方账号、套餐与权益",
    kind: "require",
    file: "packages/services/src/setting/settingService.ts",
    pattern: /NCODE_FEATURE_POLICY\.officialAccountQueries\) return Promise\.resolve\(\[\]\)/,
  },
  {
    section: "一、关闭功能 · 1 官方账号、套餐与权益",
    kind: "require",
    file: "packages/services/src/node.ts",
    pattern: /NCODE_FEATURE_POLICY\.officialAccountQueries/,
  },
  // 3.17.1 新增的官方身份与手机推送装配边界
  {
    section: "一、关闭功能 · 1 官方账号、套餐与权益",
    kind: "require",
    file: "apps/zcode-cli/packages/bootstrap/src/zcode-protocol-entrypoint.ts",
    pattern:
      /const officialMcpAuth = \{\s*\.\.\.\(NCODE_FEATURE_POLICY\.officialAccountQueries\s*\?\s*\{\s*authHeadersPort:/,
    note: "HTTP 与 stdio 的官方身份端口在生产装配处关闭，通用 adapter 保持上游实现",
  },
  {
    section: "一、关闭功能 · 8 手机远控",
    kind: "require",
    file: "packages/desktop/src/main/index.ts",
    pattern:
      /if \(NCODE_FEATURE_POLICY\.webRemoteControl\) \{\s*webRemoteControlManager\.startNotifications\(/,
    note: "手机推送不得在功能关闭时启动或读取登录身份",
  },
  ...[
    "apps/zcode-cli/packages/cli/scripts/sea-official-plugin-assets.mjs",
    "packages/desktop/scripts/prepare-agent-node-bundle.mjs",
    "packages/server/src/remote/zcodeAgentOfficialPluginAssets.ts",
  ].map((file) => ({
    section: "一、关闭功能 · 1 官方账号、套餐与权益",
    kind: /** @type {const} */ ("forbid"),
    file,
    pattern: /zcode-site/,
    note: "Sites 云部署不进入 CLI、桌面或远端官方插件资产",
  })),
  {
    section: "一、关闭功能 · 2 高速卡",
    kind: "forbid",
    file: "packages/services/src/node.ts",
    pattern: /createHighspeedCardService/,
    note: "高速卡服务不在共享服务运行时装配",
  },
  // 3. 闲时任务
  {
    section: "一、关闭功能 · 3 闲时任务",
    kind: "require",
    file: "packages/services/src/coding-plan-subscription/codingPlanSubscriptionService.ts",
    pattern: /NCODE_FEATURE_POLICY\.offPeakAvailability/,
  },
  {
    section: "一、关闭功能 · 3 闲时任务",
    kind: "forbid",
    file: "packages/ui/src/App.tsx",
    pattern: /useOffPeakTaskNotifications/,
  },
  {
    section: "一、关闭功能 · 3 闲时任务",
    kind: "forbid",
    file: "packages/desktop/src/scheduler/index.ts",
    pattern: /offPeakRepo/,
    note: "共享调度器只保留普通 Cron 认领",
  },
  // 4. 营销、邀请与奖励
  {
    section: "一、关闭功能 · 4 营销、邀请与奖励",
    kind: "forbid",
    file: "packages/services/src/node.ts",
    pattern: /createMarketingTouchService|IMarketingTouchService/,
  },
  {
    section: "一、关闭功能 · 4 营销、邀请与奖励 / 9 反馈与社群",
    kind: "forbid",
    file: "packages/ui/src/App.tsx",
    pattern: /MarketingTouch|FeedbackHost/,
  },
  // 5. 应用内升级
  {
    section: "一、关闭功能 · 5 应用内升级",
    kind: "require",
    file: "packages/desktop/src/main/index.ts",
    pattern: /enabled: NCODE_FEATURE_POLICY\.build\.autoUpdateEnabled/,
  },
  {
    section: "一、关闭功能 · 5 应用内升级",
    kind: "require",
    file: "packages/ui/src/WorkspaceHelpMenuButton.tsx",
    pattern: /NCODE_FEATURE_POLICY\.build\.autoUpdateEnabled/,
  },
  // 6. 遥测
  {
    section: "一、关闭功能 · 6 遥测",
    kind: "require",
    file: "packages/services/src/node.ts",
    pattern:
      /if\s*\(\s*NCODE_FEATURE_POLICY\.build\.armsRumEndpoint\s*\|\|\s*NCODE_FEATURE_POLICY\.build\.telemetryReportEndpoint\s*\)\s*\{\s*await ensureTelemetryDeviceMid\(/,
    note: "独立 Server 的新版装配不得绕过空端点边界创建设备身份",
  },
  {
    section: "一、关闭功能 · 6 遥测",
    kind: "forbid",
    file: "packages/ui/src/WorkspaceHelpMenuButton.tsx",
    pattern: /handleCopyDeviceMid|platform\.getDeviceId/,
  },
  {
    section: "一、关闭功能 · 6 遥测",
    kind: "require",
    file: "packages/desktop/src/main/index.ts",
    pattern: /ZCODE_TELEMETRY_REPORT_ENDPOINT !== "" \|\| ZCODE_ARMS_RUM_ENDPOINT !== ""/,
    note: "端点为空时遥测链路整体不启用",
  },
  {
    section: "一、关闭功能 · 6 遥测",
    kind: "require",
    file: "packages/desktop/src/telemetry/index.ts",
    pattern: /ZCODE_ARMS_RUM_ENDPOINT/,
    note: "ARMS 客户端仅由非空构建期地址装配",
  },
  // 7. 会话分享
  {
    section: "一、关闭功能 · 7 会话分享",
    kind: "forbid",
    file: "packages/ui/src/WorkspaceHeaderSections/WorkspaceHeaderActionSection.tsx",
    pattern: /[Cc]onversationShare|SharePopover/,
  },
  {
    section: "一、关闭功能 · 7 会话分享",
    kind: "forbid",
    file: "packages/services/src/node.ts",
    pattern:
      /(?:createConversationShareService|new\s+ConversationShare(?:Service|HttpClient))\s*\(/,
    note: "不装配真实分享服务或 HTTP client；保留关闭态接口与本地副本按需读取",
  },
  // 8. 手机远控
  {
    section: "一、关闭功能 · 8 手机远控",
    kind: "require",
    file: "packages/desktop/src/main/index.ts",
    pattern: /createWebRemoteControlFeatureGate\(NCODE_FEATURE_POLICY\.webRemoteControl\)/,
  },
  {
    section: "一、关闭功能 · 8 手机远控",
    kind: "require",
    file: "packages/desktop/src/renderer/src/main.tsx",
    pattern: /NCODE_FEATURE_POLICY\.webRemoteControl/,
  },
  // 9. 反馈与社群
  {
    section: "一、关闭功能 · 9 反馈与社群",
    kind: "forbid",
    file: "packages/ui/src/WorkspaceHelpMenuButton.tsx",
    pattern: /DropdownMenuSeparator/,
    note: "官方跳转分组消失后不得遗留孤立分隔线",
  },
  // 10. Bot / 群聊
  {
    section: "一、关闭功能 · 10 Bot / 群聊",
    kind: "forbid",
    file: "packages/ui/src/v4/SessionPane.tsx",
    pattern: /BotGroupDeliveryProvider/,
  },
  {
    section: "一、关闭功能 · 10 Bot / 群聊",
    kind: "forbid",
    file: "packages/ui/src/App.tsx",
    pattern: /BotsDialog|BotGroupDeliveryProvider/,
  },
  {
    section: "一、关闭功能 · 10 Bot / 群聊",
    kind: "forbid",
    file: "packages/services/src/node.ts",
    pattern: /createBotsService/,
    note: "共享服务入口不导出 Bot 装配，宿主打包图不含飞书 provider 与 @larksuiteoapi SDK",
  },
  // 11. 远程设备与远程工作区入口
  {
    section: "一、关闭功能 · 11 远程设备与远程工作区入口",
    kind: "require",
    file: "packages/ui/src/settings/settingsPageConfig.ts",
    pattern: /return\s*\(?\s*isSettingsSectionEnabled\(section\)/,
    note: "平台入口统一复用隐藏分区所有者，避免设置导航和深链判定分叉",
  },
  {
    section: "一、关闭功能 · 11 远程设备与远程工作区入口",
    kind: "require",
    file: "packages/ui/src/lib/settingsNavigation.ts",
    pattern: /const HIDDEN_SETTINGS_SECTIONS[\s\S]*?"remoteDevices",\s*"dataSync",/,
    note: "远程设备与新版跨设备同步同时隐藏，旧导航回落到可见分区",
  },
  {
    section: "一、关闭功能 · 1 官方账号、套餐与权益",
    kind: "forbid",
    file: "apps/zcode-cli/packages/bootstrap/src/app/official-plugin-definitions.ts",
    pattern: /name: "zcode-site"/,
    note: "官方账号云部署不进入本地版内置插件定义",
  },
  {
    section: "一、关闭功能 · 1 官方账号、套餐与权益",
    kind: "require",
    file: "apps/zcode-cli/packages/bootstrap/src/zcode-protocol-entrypoint.ts",
    pattern: /officialCommandEndpoint\s*=\s*NCODE_FEATURE_POLICY\.officialAccountQueries/,
    note: "普通 Bash 不启动官方身份转发端点",
  },
  {
    section: "一、关闭功能 · 11 远程设备与远程工作区入口",
    kind: "require",
    file: "packages/desktop/src/host/index.ts",
    pattern: /remoteStartupAutoReconnectEnabled: false/,
    // 启动重连批次（runStartupReconnectBatch）为上游 3.16 新增：旧版本 Host 无此装配，
    // 关闭承诺天然满足；机制引入后（含旧版本回移）才要求固定关闭接线。
    requiresPattern: /runStartupReconnectBatch/,
    note: "启动重连批次装配固定关闭",
  },
  // 12. 设置页新手引导入口
  {
    section: "一、关闭功能 · 12 设置页新手引导入口",
    kind: "forbid",
    file: "packages/ui/src/Root.tsx",
    pattern: /OccupationOnboarding/,
  },
  // 13. 内置 Provider 官方配置刷新
  {
    section: "一、关闭功能 · 13 内置 Provider 官方配置刷新",
    kind: "require",
    file: "packages/services/src/model-provider/providerConfigRuntime.ts",
    pattern: /zcodeBuiltinRemote\?:/,
    note: "远端刷新保持可选依赖，缺省即不刷新",
  },
  {
    section: "一、关闭功能 · 13 内置 Provider 官方配置刷新",
    kind: "forbid",
    file: "packages/services/src/node.ts",
    pattern: /zcodeBuiltinRemote|fetchZCodeBuiltinRemoteRelease|zcodeBuiltinEnvironment/,
    note: "桌面 Host 装配不接入内置 Provider 远端刷新",
  },
  // 14. 插件商店来源与分类
  {
    section: "一、关闭功能 · 14 插件商店来源与分类",
    kind: "forbid",
    file: "apps/zcode-cli/packages/bootstrap/src/app/official-plugin-definitions.ts",
    pattern: /image-search/,
  },
  {
    section: "一、关闭功能 · 14 插件商店来源与分类",
    kind: "require",
    file: "packages/shared/src/plugin-marketplaces.ts",
    // 默认来源已按 feature 清单改为 CDN；旧 GitHub 断言会误报已完成的分发适配。
    pattern: /source:\s*"https:\/\/cdn-zcode\.z\.ai\/zcode\/official-plugin\/marketplace\.json"/,
    note: "默认市场使用官方 CDN 已构建目录",
  },
  {
    section: "一、关闭功能 · 14 插件商店来源与分类",
    kind: "forbid",
    file: "packages/ui/src/settings/PluginStoreSourcesDialog.tsx",
    pattern: /DEFAULT_MARKETPLACE_ID\) return false/,
    note: "Claude 插件市场可删除：上游对默认个人市场的不可删保护不回流（补种名单不含它，删除即消失）",
  },
  {
    section: "一、关闭功能 · 14 插件商店来源与分类",
    kind: "require",
    file: "packages/ui/src/settings/PluginStoreListView.tsx",
    pattern: /!== "finance"/,
    note: "商店列表过滤金融分类",
  },
  // 定制 · 2 动态工作流命令启用
  {
    section: "二、定制修改 · 2 动态工作流命令启用",
    kind: "require",
    // 锚点落点=codingPlan 服务：三版通一（固定 onDemand 的唯一装配处；
    // 3.15+ 的 node.ts 另有 resolveDynamicWorkflowUserMode 通道，此处不依赖）。
    file: "packages/services/src/coding-plan-subscription/codingPlanSubscriptionService.ts",
    pattern: /NCODE_FEATURE_POLICY\.dynamicWorkflowMode/,
    note: "动态工作流固定 onDemand，由 /workflow 启用",
  },
  // 客户端远程配置 · 插件面板（适配器与面板清单为上游 3.16 新增，旧版本树无此文件时跳过）
  {
    section: "一、关闭功能 · 客户端远程配置（插件面板）",
    kind: "require",
    file: "packages/ui/src/plugin-ui/adapters/useInstalledUiPlugins.ts",
    pattern: /NCODE_FEATURE_POLICY\.pluginPanels === "installed"/,
    upstreamIntroducedIn: "v3.16.0",
  },
  // 客户端远程配置 · 桌面提示
  {
    section: "一、关闭功能 · 客户端远程配置（桌面提示）",
    kind: "require",
    file: "packages/desktop/src/main/index.ts",
    pattern: /NCODE_FEATURE_POLICY\.desktopContextPrompt/,
  },
];

/** 策略冻结期望值：与 policy.js 逐字段对应，锚点测试与影响映射脚本共同校验。 */
export const EXPECTED_NCODE_FEATURE_POLICY = Object.freeze({
  remoteClientConfigs: false,
  officialAccountQueries: false,
  desktopContextPrompt: true,
  webRemoteControl: false,
  offPeakAvailability: false,
  dynamicWorkflowMode: "onDemand",
  pluginPanels: "installed",
  clientScenes: false,
  clientConfigDefaults: Object.freeze({
    pluginStoreOrder: null,
    uiPluginRecommendations: Object.freeze([]),
    zsrcUrl: null,
  }),
  build: Object.freeze({
    armsRumEndpoint: "",
    telemetryReportEndpoint: "",
    autoUpdateEnabled: false,
  }),
});
