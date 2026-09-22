import { AppUsagePanel } from "@/settings/usage-stats/AppUsagePanel.js";
import { CodingPlanApiKeyUsagePanel } from "@/settings/usage-stats/CodingPlanApiKeyUsagePanel.js";

/** 展示本地会话统计，并在配置了 Coding Plan API Key 时读取可选额度快照。 */
export function UsageStatsSection() {
  return (
    <div className="space-y-8">
      <AppUsagePanel />
      <CodingPlanApiKeyUsagePanel />
    </div>
  );
}
