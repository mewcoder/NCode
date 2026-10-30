/**
 * NCode 当前仍有控制入口的本地策略唯一来源。
 * 优先提供上游已有 enabled/模式/构建 define；不读取远端、环境变量或用户配置。
 * 已删除的 UI/依赖不以假开关表示，恢复能力仍须按 ncode-feature.md 适配。
 */
export const NCODE_FEATURE_POLICY = Object.freeze({
  remoteClientConfigs: false,
  officialAccountQueries: false,
  desktopContextPrompt: true,
  webRemoteControl: false,
  offPeakAvailability: false,
  /** @type {"disabled" | "onDemand" | "alwaysOn"} */
  dynamicWorkflowMode: "onDemand",
  /** @type {"installed" | "hidden"} */
  pluginPanels: "installed",
  // 场景推荐和远端模板都不需要；复用读取入口门禁，普通 Cron 不依赖它。
  clientScenes: false,
  clientConfigDefaults: Object.freeze({
    pluginStoreOrder: null,
    uiPluginRecommendations: Object.freeze([]),
    zsrcUrl: null,
  }),
  // 复用现有构建期开关。生产依赖移除与删除的启动入口仍按精简清单维护。
  build: Object.freeze({
    armsRumEndpoint: "",
    telemetryReportEndpoint: "",
    autoUpdateEnabled: false,
  }),
});
