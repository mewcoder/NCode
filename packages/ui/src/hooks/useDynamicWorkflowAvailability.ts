import type { DynamicWorkflowClientConfig } from "@zcode/shared";

export interface DynamicWorkflowAvailabilitySnapshot {
  readonly status: "ready";
  readonly enabled: false;
  readonly config: DynamicWorkflowClientConfig | null;
}

/**
 * 读动态工作流灰度快照。
 * 只读，不触发请求：取数由 Root 里的 loader 唯一负责。消费方（自动化页、run 面板）可能位于
 * 工作区级 ServiceProvider 内（远程 Host 的 accessor），让它们各自取数会把 app 级那一份覆盖掉。
 */
export function useDynamicWorkflowAvailability(): DynamicWorkflowAvailabilitySnapshot {
  return { status: "ready", enabled: false, config: null };
}
