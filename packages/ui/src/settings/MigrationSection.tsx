import { Button } from "@/components/ui/button.js";
import { useZCodeIntl } from "@/i18n/IntlProvider.js";
import { SettingsGroupCard, SettingsRow } from "@/settings/SettingsPageParts.js";

export function MigrationSection({ onImport }: { onImport: () => void }) {
  const { intl } = useZCodeIntl();

  return (
    <SettingsGroupCard>
      <SettingsRow
        label={intl.formatMessage({ id: "occupationOnboarding.migration" })}
        description={intl.formatMessage({ id: "occupationOnboarding.migrationDescription" })}
        control={
          <Button type="button" size="lg" variant="outline" onClick={onImport}>
            {intl.formatMessage({ id: "settings.migration.title" })}
          </Button>
        }
      />
    </SettingsGroupCard>
  );
}
