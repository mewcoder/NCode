import { Button } from "@/components/ui/button.js";
import { useZCodeIntl } from "@/i18n/IntlProvider.js";
import { SettingsGroupCard, SettingsRow } from "@/settings/SettingsPageParts.js";

/**
 * NCode 数据导入分区：不重复实现扫描/选择/导入表单，只提供入口按钮，
 * 打开上游既有的统一导入流程（OnboardingDialog 的 migration 视图）。
 */
export function MigrationSection({
  onOpenImport,
  isDesktop,
}: {
  onOpenImport?: () => void;
  isDesktop?: boolean;
}) {
  const { intl } = useZCodeIntl();

  return (
    <SettingsGroupCard>
      <SettingsRow
        label={intl.formatMessage({ id: "occupationOnboarding.migration" })}
        description={intl.formatMessage({ id: "occupationOnboarding.migrationDescription" })}
        control={
          <Button
            type="button"
            size="lg"
            variant="outline"
            disabled={!isDesktop || !onOpenImport}
            onClick={onOpenImport}
          >
            {intl.formatMessage({ id: "settings.migration.title" })}
          </Button>
        }
      />
    </SettingsGroupCard>
  );
}
