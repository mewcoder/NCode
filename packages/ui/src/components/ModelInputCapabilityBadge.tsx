import { cn } from "@/components/lib/utils.js";
import { useZCodeIntl } from "@/i18n/IntlProvider.js";

export const MODEL_INPUT_CAPABILITY_BADGE_CLASS_NAME =
  "pointer-events-none inline-flex shrink-0 items-center rounded-full border border-border bg-surface px-1 py-px text-ui-xs font-medium leading-normal text-foreground-subtle";
export const MODEL_CONTEXT_WINDOW_BADGE_CLASS_NAME =
  "inline-flex h-5 max-w-20 shrink-0 items-center truncate rounded-md border border-border bg-surface px-1.5 font-mono text-ui-sm text-foreground-subtle";

export function ModelInputCapabilityBadge({ className }: { className?: string }) {
  const { intl } = useZCodeIntl();
  const label = intl.formatMessage({ id: "model.capability.vision" });

  return (
    <span
      className={cn(MODEL_INPUT_CAPABILITY_BADGE_CLASS_NAME, className)}
      data-model-input-capability="vision"
      aria-label={label}
      title={label}
    >
      {label}
    </span>
  );
}
