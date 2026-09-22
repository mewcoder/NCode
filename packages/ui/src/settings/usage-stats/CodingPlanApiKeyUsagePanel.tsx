import { RefreshCw } from "lucide-react";
import type { UsageEntitlementSnapshot } from "@zcode/shared";
import { Button } from "@/components/ui/button.js";
import { useProviderSettingsView } from "@/hooks/useProviderSettingsView.js";
import { useUsageEntitlement } from "@/hooks/useUsageEntitlement.js";
import { useZCodeIntl } from "@/i18n/IntlProvider.js";
import { buildUsageEntitlementCacheKey } from "@/lib/usageEntitlementCache.js";
import {
  findCodingPlanQuotaLimit,
  formatQuotaRemainingPercentage,
} from "@/lib/codingPlanQuotaPresentation.js";
import { UsageStatsErrorNotice } from "@/settings/usage-stats/UsageStatsErrorNotice.js";
import { UsageEmptyState } from "@/settings/usage-stats/usageStatsUiParts.js";

interface CodingPlanApiKeySource {
  providerId: string;
  label: string;
}

/**
 * 读取用户配置的 Coding Plan API Key 的套餐额度。
 *
 * 这里故意不读取 accountAccess，也不展示购买/登录/升级入口；账号 OAuth 被关闭后，
 * 仍可通过 Provider 配置里的 API Key 获取供应商主动提供的额度快照。
 */
export function CodingPlanApiKeyUsagePanel() {
  const { intl } = useZCodeIntl();
  const { state } = useProviderSettingsView();
  if (state.status !== "ready") {
    return null;
  }

  const sources = state.view.providers.flatMap((provider) => {
    const access = provider.effectiveConfig.access;
    if (access?.type !== "zhipu-coding-plan-api-key" || !access.apiKey?.trim()) {
      return [];
    }
    return [
      {
        providerId: provider.providerId,
        label: provider.providerName?.trim() || provider.templateId || provider.providerId,
      } satisfies CodingPlanApiKeySource,
    ];
  });

  if (sources.length === 0) {
    return null;
  }

  return (
    <section className="space-y-3">
      <div>
        <h3 className="text-ui-base font-medium text-foreground">
          {intl.formatMessage({ id: "settings.usage.apiKeyTitle" })}
        </h3>
        <p className="mt-1 text-ui-sm text-foreground-subtle">
          {intl.formatMessage({ id: "settings.usage.apiKeyDescription" })}
        </p>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        {sources.map((source) => (
          <CodingPlanApiKeyUsageCard key={source.providerId} source={source} />
        ))}
      </div>
    </section>
  );
}

function CodingPlanApiKeyUsageCard({ source }: { source: CodingPlanApiKeySource }) {
  const { intl, locale } = useZCodeIntl();
  const { snapshot, loading, error, refresh } = useUsageEntitlement({
    enabled: true,
    includeSubscription: true,
    preferredProviderId: source.providerId,
    requirePreferredProvider: true,
    allowEnvApiKey: false,
    cacheKey: buildUsageEntitlementCacheKey({
      providerId: source.providerId,
      providerFingerprint: `api-key:${source.providerId}`,
    }),
    refreshOnMount: true,
  });

  return (
    <article className="rounded-xl border border-border bg-surface px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-ui-base font-medium text-foreground">{source.label}</div>
          <div className="mt-1 text-ui-xs text-foreground-subtle">
            {intl.formatMessage({ id: "settings.usage.apiKeyLabel" })}
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-7 shrink-0"
          aria-label={intl.formatMessage({ id: "settings.usage.refresh" })}
          onClick={() => void refresh({ force: true, silent: true })}
        >
          <RefreshCw className="size-3.5" />
        </Button>
      </div>

      {error ? <UsageStatsErrorNotice error={error} /> : null}
      {loading && !snapshot ? (
        <UsageEmptyState
          title={intl.formatMessage({ id: "settings.usage.loadingTitle" })}
          description={intl.formatMessage({ id: "settings.usage.codingPlanLoadingDescription" })}
        />
      ) : snapshot ? (
        <CodingPlanApiKeySnapshot snapshot={snapshot} locale={locale} />
      ) : null}
    </article>
  );
}

function CodingPlanApiKeySnapshot({
  snapshot,
  locale,
}: {
  snapshot: UsageEntitlementSnapshot;
  locale: string;
}) {
  const { intl } = useZCodeIntl();
  const limit =
    findCodingPlanQuotaLimit(snapshot.quota?.limits, "TOKENS_LIMIT", 3, 5) ??
    snapshot.quota?.limits[0] ??
    null;
  const planNames = snapshot.subscription?.details
    .map((detail) => detail.productName.trim())
    .filter(Boolean)
    .join("、");
  const status =
    snapshot.unavailableReason === "no_plan"
      ? intl.formatMessage({ id: "settings.usage.apiKeyNoPlan" })
      : planNames || intl.formatMessage({ id: "settings.usage.apiKeyConfigured" });
  const remaining = snapshot.remaining?.percentage ?? null;

  return (
    <div className="mt-4 grid grid-cols-2 gap-3 text-ui-sm">
      <div>
        <div className="text-foreground-subtle">
          {intl.formatMessage({ id: "settings.usage.planStatus" })}
        </div>
        <div className="mt-1 truncate text-foreground">{status}</div>
      </div>
      <div>
        <div className="text-foreground-subtle">
          {intl.formatMessage({ id: "settings.usage.remainingRatio" })}
        </div>
        <div className="mt-1 text-foreground">
          {limit
            ? formatQuotaRemainingPercentage(locale, limit)
            : remaining != null
              ? `${remaining}%`
              : "--"}
        </div>
      </div>
      <div>
        <div className="text-foreground-subtle">
          {intl.formatMessage({ id: "settings.usage.quotaLevel" })}
        </div>
        <div className="mt-1 truncate text-foreground">
          {snapshot.quota?.level || intl.formatMessage({ id: "settings.usage.notAvailable" })}
        </div>
      </div>
      <div>
        <div className="text-foreground-subtle">
          {intl.formatMessage({ id: "settings.usage.updatedAt" })}
        </div>
        <div className="mt-1 text-foreground">
          {new Intl.DateTimeFormat(locale, { dateStyle: "short", timeStyle: "short" }).format(
            snapshot.generatedAt,
          )}
        </div>
      </div>
    </div>
  );
}
