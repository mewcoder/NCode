import type { AppSettings } from "@zcode/shared";

/**
 * 闲时任务资格入口。
 *
 * NCode 关闭闲时任务，因此这里不再初始化 Store、也不再按 Registry revision 查询资格；
 * 保留同名 hook 是为了让上游调用点（AutomationsSection、OffPeakNewTaskEntry）维持原有挂载结构。
 */
export function useOffPeakEligibility(
  settings: AppSettings | null | undefined,
  registryRevision: number | undefined,
): void {
  void settings;
  void registryRevision;
}
