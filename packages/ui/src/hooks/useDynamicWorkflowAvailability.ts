import { useMemo } from "react";
import { useSettings } from "@/hooks/useSettingService.js";

/**
 * 动态工作流的 UI 入口由持久化用户开关唯一控制。
 * 缺少设置时沿用 schema 的默认开启值；设置读取失败时关闭入口，避免显示状态与 runtime 偏好分歧。
 */
export function useDynamicWorkflowAvailability(): { enabled: boolean } {
  const { settings, loading, error } = useSettings();
  const enabled = settings
    ? settings.dynamicWorkflowEnabled !== false
    : !loading && error === null;
  return useMemo(
    () => ({ enabled }),
    [enabled],
  );
}
