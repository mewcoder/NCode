import { useEffect, useEffectEvent, useState } from "react";
import { useGlobalAgentsInstructionsService } from "@/hooks/personalization/useGlobalAgentsInstructionsService.js";
import { useZCodeIntl } from "@/i18n/IntlProvider.js";
import { logger } from "@/logger.js";
import { Button } from "@/components/ui/button.js";
import { toast } from "@/components/ui/toast.js";
import { SettingsFormTextarea } from "@/settings/SettingsFormTextarea.js";
import { SettingsGroupCard } from "@/settings/SettingsPageParts.js";

export function PersonalizationSection() {
  const { intl } = useZCodeIntl();
  const settingsSyncService = useGlobalAgentsInstructionsService();
  const [globalAgentsInstructionsPath, setGlobalAgentsInstructionsPath] = useState("");
  const [globalAgentsInstructions, setGlobalAgentsInstructions] = useState("");
  const [globalAgentsInstructionsDraft, setGlobalAgentsInstructionsDraft] = useState("");
  const [globalAgentsInstructionsLoading, setGlobalAgentsInstructionsLoading] = useState(false);
  const [globalAgentsInstructionsSaving, setGlobalAgentsInstructionsSaving] = useState(false);
  const [globalAgentsInstructionsLoadFailed, setGlobalAgentsInstructionsLoadFailed] =
    useState(false);
  // Bug 原因：intl 随语言变化会重跑读取并覆盖未保存草稿；错误文案读取当前语言，文件加载只跟随服务身份。
  const notifyLoadFailed = useEffectEvent(() => {
    toast(intl.formatMessage({ id: "settings.customInstructionsLoadFailed" }));
  });
  useEffect(() => {
    let cancelled = false;
    setGlobalAgentsInstructionsLoading(true);
    setGlobalAgentsInstructionsLoadFailed(false);
    void Promise.all([
      settingsSyncService.readGlobalAgentsInstructions(),
      settingsSyncService.getGlobalAgentsInstructionsPath(),
    ])
      .then(([content, path]) => {
        if (cancelled) return;
        setGlobalAgentsInstructionsPath(path);
        setGlobalAgentsInstructions(content);
        setGlobalAgentsInstructionsDraft(content);
      })
      .catch((error) => {
        if (cancelled) return;
        logger.warn("[settings] Failed to load global AGENTS.md", error);
        setGlobalAgentsInstructionsLoadFailed(true);
        notifyLoadFailed();
      })
      .finally(() => {
        if (!cancelled) setGlobalAgentsInstructionsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [settingsSyncService]);

  return (
    <SettingsGroupCard>
      <div className="space-y-3 p-4">
        <div className="space-y-1">
          <label
            htmlFor="global-agents-instructions"
            className="text-ui-base font-medium text-foreground"
          >
            {intl.formatMessage({ id: "settings.customInstructions" })}
          </label>
          <p className="text-ui-base leading-6 text-foreground-subtle">
            {intl.formatMessage(
              { id: "settings.customInstructionsFilePath" },
              { path: globalAgentsInstructionsPath },
            )}
          </p>
        </div>
        <SettingsFormTextarea
          id="global-agents-instructions"
          aria-label={intl.formatMessage({
            id: "settings.customInstructions",
          })}
          className="field-sizing-fixed min-h-40 resize-y"
          rows={7}
          disabled={
            globalAgentsInstructionsLoading ||
            globalAgentsInstructionsSaving ||
            globalAgentsInstructionsLoadFailed
          }
          placeholder={intl.formatMessage({
            id: "settings.customInstructionsPlaceholder",
          })}
          value={globalAgentsInstructionsDraft}
          onChange={(event) => setGlobalAgentsInstructionsDraft(event.target.value)}
        />
        <div className="flex justify-end">
          <Button
            type="button"
            size="lg"
            disabled={
              globalAgentsInstructionsLoading ||
              globalAgentsInstructionsSaving ||
              globalAgentsInstructionsLoadFailed ||
              globalAgentsInstructionsDraft === globalAgentsInstructions
            }
            onClick={async () => {
              setGlobalAgentsInstructionsSaving(true);
              try {
                await settingsSyncService.writeGlobalAgentsInstructions(
                  globalAgentsInstructionsDraft,
                );
                setGlobalAgentsInstructions(globalAgentsInstructionsDraft);
                toast(
                  intl.formatMessage({
                    id: "settings.customInstructionsSaved",
                  }),
                );
              } catch (error) {
                logger.warn("[settings] Failed to save global AGENTS.md", error);
                toast(
                  intl.formatMessage({
                    id: "settings.customInstructionsSaveFailed",
                  }),
                );
              } finally {
                setGlobalAgentsInstructionsSaving(false);
              }
            }}
          >
            {intl.formatMessage({
              id: globalAgentsInstructionsSaving ? "common.saving" : "common.save",
            })}
          </Button>
        </div>
      </div>
    </SettingsGroupCard>
  );
}
