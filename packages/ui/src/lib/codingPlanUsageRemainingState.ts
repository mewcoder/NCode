import type {
  UsageEntitlementSnapshot,
  ZCodeAccountAccess,
  ZCodeProviderAccountAccess,
} from "@zcode/shared";
import type {
  SidebarUsageCodingPlanProviderId,
  SidebarUsageCodingPlanSourceId,
} from "@/lib/sidebarUsageCodingPlanProviderPreference.js";

export interface CodingPlanUsageRemainingEntitlement {
  sourceId?: SidebarUsageCodingPlanSourceId;
  providerId: SidebarUsageCodingPlanProviderId;
  accountAccess: ZCodeProviderAccountAccess | ZCodeAccountAccess;
  label?: string;
  snapshot: UsageEntitlementSnapshot | null;
  loading: boolean;
  error: string | null;
}

export interface CodingPlanUsageAvailableProvider {
  providerId: SidebarUsageCodingPlanProviderId;
  accountAccess: ZCodeProviderAccountAccess | ZCodeAccountAccess;
  label: string;
}

export interface CodingPlanUsageRemainingState {
  displayedEntitlement: CodingPlanUsageRemainingEntitlement | null;
  displayedProviderId?: SidebarUsageCodingPlanSourceId;
  loading: boolean;
  visibleSnapshot: UsageEntitlementSnapshot | null;
}

function getEntitlementSourceId(
  entitlement: Pick<CodingPlanUsageRemainingEntitlement, "providerId" | "sourceId">,
): SidebarUsageCodingPlanSourceId {
  return entitlement.sourceId ?? entitlement.providerId;
}

function hasActiveCodingPlanSnapshot(
  snapshot: UsageEntitlementSnapshot | null,
  providerId: string,
): boolean {
  return (
    snapshot?.provider?.id === providerId &&
    snapshot.unavailableReason !== "no_plan" &&
    Boolean(snapshot.subscription?.details.length)
  );
}

export function resolveCodingPlanUsageRemainingState(params: {
  availableProviders: CodingPlanUsageAvailableProvider[];
  entitlements: CodingPlanUsageRemainingEntitlement[];
  modelProvidersLoading: boolean;
  selectedProviderId?: SidebarUsageCodingPlanSourceId;
}): CodingPlanUsageRemainingState | null {
  const providerEntitlements = params.entitlements.filter(
    (entitlement) =>
      getEntitlementSourceId(entitlement).startsWith("team:") ||
      params.availableProviders.some((provider) => provider.providerId === entitlement.providerId),
  );
  const selectedEntitlement = providerEntitlements.find(
    (entitlement) => getEntitlementSourceId(entitlement) === params.selectedProviderId,
  );
  const activeEntitlement =
    (selectedEntitlement &&
    hasActiveCodingPlanSnapshot(selectedEntitlement.snapshot, selectedEntitlement.providerId)
      ? selectedEntitlement
      : undefined) ??
    providerEntitlements.find((entitlement) =>
      hasActiveCodingPlanSnapshot(entitlement.snapshot, entitlement.providerId),
    );
  const displayedEntitlement =
    activeEntitlement ?? selectedEntitlement ?? providerEntitlements[0] ?? null;
  const activeProviderId = activeEntitlement
    ? getEntitlementSourceId(activeEntitlement)
    : undefined;
  const displayedProviderId = activeProviderId ?? params.selectedProviderId;
  const loading =
    params.modelProvidersLoading || providerEntitlements.some((entitlement) => entitlement.loading);
  const visibleSnapshot =
    displayedEntitlement &&
    hasActiveCodingPlanSnapshot(displayedEntitlement.snapshot, displayedEntitlement.providerId)
      ? displayedEntitlement.snapshot
      : null;
  const hasAnyActiveCodingPlan = Boolean(activeEntitlement);

  if (
    (!params.modelProvidersLoading && providerEntitlements.length === 0) ||
    (!loading && !hasAnyActiveCodingPlan)
  ) {
    return null;
  }

  return {
    displayedEntitlement,
    displayedProviderId,
    loading,
    visibleSnapshot,
  };
}
