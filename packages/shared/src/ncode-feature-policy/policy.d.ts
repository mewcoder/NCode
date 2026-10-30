/**
 * `policy.js` 的公开类型声明。
 *
 * 修复原因：`policy.js` 为了让纯 Node 构建脚本（scripts/build-time-config.mjs）在未构建
 * shared 时也能直接导入，刻意保持 JS 形式，只有 packages/shared 自己开了 `allowJs`。
 * 但 `@zcode/shared` 的 exports 指向 `src/index.ts`，apps/zcode-cli/packages/contracts 这类
 * **未开启 `allowJs`** 的下游项目会直接编译 shared 源码树，解析 `./policy.js` 时找不到声明文件，
 * 报 TS7016 并使 `pnpm dev:desktop` 的 agent-cli 构建步骤中断。
 * 修复依据：沿用仓库既有的 `.js` + 手写 `.d.ts` 配对方式（schedulerProtocol、genUiTweakRuntime），
 * 形状与 `pnpm build` 从 policy.js 推断出的 dist/ncode-feature-policy/policy.d.ts 保持一致，
 * 不新增导入边、不改变运行时取值。修改 policy.js 的字段或字面量时必须同步本文件。
 */
export const NCODE_FEATURE_POLICY: Readonly<{
  remoteClientConfigs: false;
  officialAccountQueries: false;
  desktopContextPrompt: true;
  webRemoteControl: false;
  offPeakAvailability: false;
  /** 与 shared 的 DynamicWorkflowMode 取值一致，内联以保持本模块 requires 为空。 */
  dynamicWorkflowMode: "disabled" | "onDemand" | "alwaysOn";
  /** 面板只允许“已安装可见”或“隐藏”两种本地策略。 */
  pluginPanels: "installed" | "hidden";
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
