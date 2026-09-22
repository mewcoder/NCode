import { useCallback } from "react";
import {
  normalizeProviderFamilyDomain,
  resolvePlanIdentitySnapshot,
  type PlanIdentitySnapshot,
  type ProviderFamilyConnectionSelection,
  type ProviderFamilyDomain,
} from "@zcode/shared";
import type { IUsageStatsService } from "@zcode/services";
import { USAGE_ENTITLEMENT_CACHE_TTL_MS } from "@/lib/usageEntitlementCache.js";

/**
 * 账号套餐身份不再参与本地运行时。保留 telemetry 读取函数的形状，但返回未知套餐，
 * 不读取 Provider Registry、OAuth 凭据或官方 entitlement 接口。
 */
export function usePlanIdentitySnapshot(
  providerFamilyDomain: ProviderFamilyDomain | null | undefined,
  _connectionSelection: ProviderFamilyConnectionSelection | null | undefined,
  _usageStatsService?: IUsageStatsService,
): () => PlanIdentitySnapshot {
  const normalizedDomain = normalizeProviderFamilyDomain(providerFamilyDomain);

  return useCallback(
    () =>
      resolvePlanIdentitySnapshot({
        providerFamilyDomain: normalizedDomain,
        codingPlanEntitlement: null,
        startPlanEntitlement: null,
        now: Date.now(),
        entitlementCacheTtlMs: USAGE_ENTITLEMENT_CACHE_TTL_MS,
      }),
    [normalizedDomain],
  );
}
