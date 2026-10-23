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
  // 2. 高速卡
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
    pattern: /createConversationShareService\(/,
    note: "分享服务不在共享服务运行时注册（导出与本地上传辅助不受限）",
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
    pattern: /return section !== "remoteDevices"/,
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
    pattern: /zai-org\/zcode-plugins/,
    note: "默认市场使用 GitHub 仓库源",
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
    file: "packages/services/src/node.ts",
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
