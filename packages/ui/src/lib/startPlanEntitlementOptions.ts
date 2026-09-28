import type { ProviderSettingsView } from "@zcode/services";
import type { UseUsageEntitlementOptions } from "@/hooks/useUsageEntitlement.js";

/** NCode 不查询网页登录账号的 Start Plan 权益和额度；保留现有调用方配置契约。 */
export function buildStartPlanEntitlementOptions(
  _view: ProviderSettingsView | null | undefined,
  providerId: string,
): UseUsageEntitlementOptions {
  return {
    enabled: false,
    preferredProviderId: providerId,
    includeSubscription: true,
    allowDisabledPreferredProvider: true,
    requirePreferredProvider: true,
    allowEnvApiKey: false,
    refreshOnMount: false,
  };
}
