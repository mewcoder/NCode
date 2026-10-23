export interface NcodeClosureAnchor {
  /** ncode-feature.md 章节引用，失败时定位关闭项。 */
  section: string;
  kind: "require" | "forbid";
  /** 相对仓库根的文件路径。 */
  file: string;
  pattern: RegExp;
  note?: string;
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
