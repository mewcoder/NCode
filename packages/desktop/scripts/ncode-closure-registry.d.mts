export interface NcodeClosureAnchor {
  /** ncode-feature.md 章节引用，失败时定位关闭项。 */
  section: string;
  kind: "require" | "forbid";
  /** 相对仓库根的文件路径。 */
  file: string;
  pattern: RegExp;
  note?: string;
  /**
   * 锚点目标文件由上游该版本起新增（如 3.16 的插件面板适配器）。
   * 被校验的旧版本树没有此文件时跳过该锚点，不计为差距；文件存在则正常校验。
   */
  upstreamIntroducedIn?: string;
  /**
   * 前置条件：仅当文件内容命中该正则（机制已引入）时才校验主 pattern。
   * 用于“锚点文件旧版本已存在、但被关闭的机制本身由上游新版引入”的场景。
   */
  requiresPattern?: RegExp;
}

export const NCODE_CLOSURE_ANCHORS: NcodeClosureAnchor[];

export const EXPECTED_NCODE_FEATURE_POLICY: Readonly<{
  remoteClientConfigs: false;
  officialAccountQueries: false;
  desktopContextPrompt: true;
  webRemoteControl: false;
  offPeakAvailability: false;
  dynamicWorkflowMode: "onDemand";
  pluginPanels: "installed";
  clientScenes: false;
  clientConfigDefaults: Readonly<{
    pluginStoreOrder: null;
    uiPluginRecommendations: readonly never[];
    zsrcUrl: null;
  }>;
  build: Readonly<{
    armsRumEndpoint: "";
    telemetryReportEndpoint: "";
    autoUpdateEnabled: false;
  }>;
}>;
