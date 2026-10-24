// NCode E2E 基线：默认全量正式套件排除专测已关闭功能的 spec。
// 数据与 ncode-feature.md「一、关闭功能」对应（docs/ncode-closure-regression.spec.md）。
// 只有断言已关闭功能存在或依赖其 mock/凭据的 spec 才进清单；防御性引用
// （skipOccupationOnboardingIfPresent）与断言关闭态的 spec 不排除。
// 定向 `--spec` 运行不受本清单限制，保留调试上游行为的能力。

export const NCODE_CLOSED_E2E_SPECS = [
  // 一、1 官方账号、套餐与权益
  { spec: "./test/e2e/coding-plan-team-usage.test.ts", feature: "official-plan" },
  { spec: "./test/e2e/coding-plan-upgrade-personal-sold-out.test.ts", feature: "official-plan" },
  { spec: "./test/e2e/coding-plan-upgrade-personal-system-busy.test.ts", feature: "official-plan" },
  {
    spec: "./test/e2e/coding-plan-upgrade-webview-refresh-provider.test.ts",
    feature: "official-plan",
  },
  {
    spec: "./test/e2e/settings/coding-plan-entitlement-presentation.test.ts",
    feature: "official-plan",
  },
  { spec: "./test/e2e/settings/provider-plan-navigation-labels.test.ts", feature: "official-plan" },
  { spec: "./test/e2e/subagent-coding-plan-login-catalog-stale.test.ts", feature: "official-plan" },
  { spec: "./test/e2e/oauth-login-failure-cancel.test.ts", feature: "official-plan" },
  { spec: "./test/e2e/oauth-credential-recovery.test.ts", feature: "official-plan" },
  { spec: "./test/e2e/provider-family-responsive.test.ts", feature: "official-plan" },
  {
    spec: "./test/e2e/conversation-session/conversation-session-model-provider-turbo-recovery.test.ts",
    feature: "official-plan",
  },
  {
    spec: "./test/e2e/conversation-session/conversation-session-model-provider-turbo-switch.test.ts",
    feature: "official-plan",
  },
  {
    spec: "./test/e2e/conversation-session/conversation-session-model-provider-restart-recovery.test.ts",
    feature: "official-plan",
  },
  {
    spec: "./test/e2e/conversation-session/conversation-session-model-provider-settings-transition.test.ts",
    feature: "official-plan",
  },
  // 一、2 高速卡
  {
    spec: "./test/e2e/conversation-session/conversation-session-highspeed-card.test.ts",
    feature: "highspeed",
  },
  {
    spec: "./test/e2e/conversation-session/conversation-session-highspeed-card-draw-miss.test.ts",
    feature: "highspeed",
  },
  {
    spec: "./test/e2e/conversation-session/conversation-session-highspeed-card-draw-timeout.test.ts",
    feature: "highspeed",
  },
  // 一、3 闲时任务
  { spec: "./test/e2e/off-peak-automations-home-layout.test.ts", feature: "off-peak" },
  { spec: "./test/e2e/off-peak-create-manage.test.ts", feature: "off-peak" },
  { spec: "./test/e2e/off-peak-limit-pre-gate.test.ts", feature: "off-peak" },
  // 一、4 营销、邀请与奖励
  { spec: "./test/e2e/ui-shell/marketing-touch-anonymous.test.ts", feature: "marketing" },
  { spec: "./test/e2e/ui-shell/marketing-touch-delivery.test.ts", feature: "marketing" },
  { spec: "./test/e2e/ui-shell/marketing-touch-entitlement.test.ts", feature: "marketing" },
  { spec: "./test/e2e/ui-shell/marketing-touch-rewards.test.ts", feature: "marketing" },
  // 一、5 应用内升级 + 一、9 反馈与社群（部分引用：帮助菜单标签断言官方社群/反馈/检查更新；
  // 导出日志与关于窗口为保留行为，替代 spec 属后续独立工作）
  { spec: "./test/e2e/help-menu-about.test.ts", feature: "update-feedback", partial: true },
  // 一、6 遥测（断言 ARMS 遥测 payload 落盘）
  { spec: "./test/e2e/process-resource-telemetry-roles.test.ts", feature: "telemetry" },
  // 一、7 会话分享（share-popover spec 为上游 3.16 新增，本版本无该文件；
  // 文件名特征模式仍在 NCODE_CLOSED_E2E_NAME_PATTERNS 中拦截）
  // 一、10 Bot / 群聊
  { spec: "./test/e2e/bots/bot-automation-result-delivery.test.ts", feature: "bots" },
  { spec: "./test/e2e/bots/bot-remote-disconnected.test.ts", feature: "bots" },
  { spec: "./test/e2e/bots/bot-runtime-authority.test.ts", feature: "bots" },
  { spec: "./test/e2e/bots/feishu-bound-groups-ui.test.ts", feature: "bots" },
  { spec: "./test/e2e/bots/feishu-channel-mention.test.ts", feature: "bots" },
  { spec: "./test/e2e/bots/feishu-provider-interactions.test.ts", feature: "bots" },
  { spec: "./test/e2e/bots/feishu-runtime-error-ui.test.ts", feature: "bots" },
  { spec: "./test/e2e/bots/feishu-streaming-card-lifecycle.test.ts", feature: "bots" },
  {
    spec: "./test/e2e/conversation-session/conversation-session-bot-channel-worker.test.ts",
    feature: "bots",
  },
  {
    spec: "./test/e2e/conversation-session/conversation-session-bot-continuous-worker.test.ts",
    feature: "bots",
  },
  {
    spec: "./test/e2e/conversation-session/conversation-session-bot-topic-worker.test.ts",
    feature: "bots",
  },
  // 客户端远程配置：断言 client/configs 请求与灰度预热
  { spec: "./test/e2e/help-client-config.test.ts", feature: "remote-client-config" },
  // （settings-client-language-header spec 为上游 3.16 新增，本版本无该文件；
  // 文件名特征模式仍拦截）
  // 一、11 远程设备与远程工作区（SSH P0；上游仅按环境门禁，NCode 无条件关闭）
  {
    spec: "./test/e2e/conversation-session/conversation-session-ssh-remote-connection-p0.test.ts",
    feature: "remote-devices",
  },
  {
    spec: "./test/e2e/conversation-session/conversation-session-ssh-remote-development-p0.test.ts",
    feature: "remote-devices",
  },
  {
    spec: "./test/e2e/conversation-session/conversation-session-ssh-remote-p0.test.ts",
    feature: "remote-devices",
  },
];

const CLOSED_SPEC_PATHS = new Set(NCODE_CLOSED_E2E_SPECS.map((entry) => entry.spec));

// 漂移检测：默认正式集合中文件名命中这些模式的 spec 必须已登记，
// 防止上游新增同类 spec 静默进入 NCode 基线。
export const NCODE_CLOSED_E2E_NAME_PATTERNS = [
  /(^|\/)bots\//,
  /feishu-/,
  /conversation-session-bot-/,
  /bot-(automation-result|remote-disconnected|runtime-authority)/,
  /off-peak|offpeak/,
  /highspeed/,
  /coding-plan|provider-plan|entitlement/,
  /marketing-touch/,
  /share-popover/,
  /oauth-login|oauth-credential/,
  /client-config|client-language-header/,
  /process-resource-telemetry/,
  /ssh-remote/,
  /provider-family-responsive/,
];

export function isNcodeClosedE2ESpec(spec) {
  const normalized = spec.replaceAll("\\", "/");
  return CLOSED_SPEC_PATHS.has(normalized);
}

// wdio exclude 只在非定向运行时生效，与 SSH 环境门禁同一模式。
export const NCODE_CLOSED_E2E_EXCLUDE_SPECS = NCODE_CLOSED_E2E_SPECS.map((entry) => entry.spec);
