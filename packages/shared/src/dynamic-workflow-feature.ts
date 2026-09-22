// Dynamic Workflow 的本地取值域与客户端快照。

export const DYNAMIC_WORKFLOW_MODES = ["disabled", "onDemand", "alwaysOn"] as const;
export type DynamicWorkflowMode = (typeof DYNAMIC_WORKFLOW_MODES)[number];

/**
 * 本地覆盖用的环境变量。语义按构建档位分三层，由 Desktop main 在 fork Host 前**改写或删除**
 * （desktopRuntimeEnv.ts 的 buildHostProcessEnv），Host 只消费不再分辨来源：
 *   - 未打包 dev：透传开发者 shell 里的合法取值；
 *   - 打包 preview：固定写入 `alwaysOn`，忽略 shell；
 *   - 打包 production：删除继承值，永不写入。
 * 没有 main 的 Web/server Host 直接读进程环境（运维/开发者设置）。
 */
export const ZCODE_DYNAMIC_WORKFLOW_MODE_ENV = "ZCODE_DYNAMIC_WORKFLOW_MODE";

/** 本地未配置或格式非法时 fail-closed。 */
export const DEFAULT_DYNAMIC_WORKFLOW_MODE: DynamicWorkflowMode = "disabled";

export function normalizeDynamicWorkflowMode(value: unknown): DynamicWorkflowMode | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return (DYNAMIC_WORKFLOW_MODES as readonly string[]).includes(trimmed)
    ? (trimmed as DynamicWorkflowMode)
    : undefined;
}

/**
 * 解析保留服务端契约的三态，消费侧统一转换为布尔开关。
 * 将来 onDemand 有独立行为时，只需调整消费侧。
 */
export function isDynamicWorkflowModeEnabled(mode: DynamicWorkflowMode): boolean {
  return mode !== "disabled";
}

/** 快照的来源：观测用，UI 与日志据此区分本地覆盖与默认值。 */
export type DynamicWorkflowClientConfigSource = "override" | "default";

export interface DynamicWorkflowClientConfig {
  readonly mode: DynamicWorkflowMode;
  /** 等于 isDynamicWorkflowModeEnabled(mode)；单独落字段免得每个消费者各写一遍折叠规则。 */
  readonly enabled: boolean;
  readonly source: DynamicWorkflowClientConfigSource;
}

export function createDynamicWorkflowClientConfig(
  mode: DynamicWorkflowMode,
  source: DynamicWorkflowClientConfigSource,
): DynamicWorkflowClientConfig {
  return { mode, enabled: isDynamicWorkflowModeEnabled(mode), source };
}
