import { Switch } from "@/components/ui/switch.js";
import { toast } from "@/components/ui/toast.js";
import { useSettings } from "@/hooks/useSettingService.js";
import { useZCodeIntl } from "@/i18n/IntlProvider.js";
import { logger } from "@/logger.js";
import { SettingsGroupCard, SettingsRow } from "@/settings/SettingsPageParts.js";

export function DynamicWorkflowsSection() {
  const { intl } = useZCodeIntl();
  const { settings, error, update } = useSettings();
  const enabled = settings ? settings.dynamicWorkflowEnabled !== false : error === null;

  return (
    <SettingsGroupCard>
      <SettingsRow
        label={
          <span className="inline-flex items-center gap-2">
            {intl.formatMessage({ id: "settings.dynamicWorkflows.enabled" })}
            <span className="rounded bg-surface px-1.5 py-0.5 text-ui-xs font-medium text-foreground-subtle">
              {intl.formatMessage({ id: "settings.dynamicWorkflows.betaBadge" })}
            </span>
          </span>
        }
        description={intl.formatMessage({ id: "settings.dynamicWorkflows.description" })}
        control={
          <Switch
            aria-label={intl.formatMessage({ id: "settings.dynamicWorkflows.enabled" })}
            checked={enabled}
            onCheckedChange={(nextEnabled) => {
              void update({ dynamicWorkflowEnabled: nextEnabled }).catch((updateError) => {
                logger.warn("[dynamic-workflow] 保存用户偏好失败", updateError);
                toast(intl.formatMessage({ id: "settings.dynamicWorkflows.updateFailed" }), {
                  variant: "warning",
                });
              });
            }}
          />
        }
      />
    </SettingsGroupCard>
  );
}
