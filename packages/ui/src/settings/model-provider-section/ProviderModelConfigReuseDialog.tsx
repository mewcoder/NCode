import { useEffect, useState } from "react";
import type { ModelConfigObject } from "@zcode/provider";
import {
  MODEL_CONTEXT_WINDOW_BADGE_CLASS_NAME,
  MODEL_INPUT_CAPABILITY_BADGE_CLASS_NAME,
} from "@/components/ModelInputCapabilityBadge.js";
import { Button } from "@/components/ui/button.js";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command.js";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog.js";
import { cn } from "@/components/lib/utils.js";
import { useZCodeIntl } from "@/i18n/IntlProvider.js";

export interface ProviderModelConfigReuseOption {
  key: string;
  config: ModelConfigObject;
  sources: readonly ProviderModelConfigReuseSource[];
  providersLabel: string;
  searchText: string;
}

export interface ProviderModelConfigReuseSource {
  providerId: string;
  providerName: string;
  modelId: string;
}

function formatTokenSize(value: number, locale: string): string {
  const thousands = value / 1_000;
  if (thousands >= 999.5) {
    const millions = value / 1_000_000;
    return `${new Intl.NumberFormat(locale, {
      maximumFractionDigits: millions < 10 ? 1 : 0,
    }).format(millions)}M`;
  }
  return `${new Intl.NumberFormat(locale, {
    maximumFractionDigits: thousands < 10 ? 1 : 0,
  }).format(thousands)}K`;
}

function filterReuseConfigModelId(_value: string, search: string, keywords?: string[]): number {
  const normalizedSearch = search.trim().toLocaleLowerCase();
  const modelId = keywords?.[0]?.toLocaleLowerCase() ?? "";
  return normalizedSearch.length === 0 || modelId.includes(normalizedSearch) ? 1 : 0;
}

export function ProviderModelConfigReuseDialog({
  open,
  options,
  initialSelectedKey,
  onOpenChange,
  onApply,
}: {
  open: boolean;
  options: readonly ProviderModelConfigReuseOption[];
  initialSelectedKey?: string | null;
  onOpenChange: (open: boolean) => void;
  onApply: (option: ProviderModelConfigReuseOption) => void;
}) {
  const { intl, locale } = useZCodeIntl();
  const [selectedKey, setSelectedKey] = useState<string | null>(initialSelectedKey ?? null);
  const selectedOption = options.find((option) => option.key === selectedKey);

  useEffect(() => {
    setSelectedKey(open ? (initialSelectedKey ?? null) : null);
  }, [initialSelectedKey, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden p-0">
        <DialogHeader className="px-4 pt-5">
          <DialogTitle>{intl.formatMessage({ id: "settings.modelProvider.reuseConfig" })}</DialogTitle>
        </DialogHeader>
        <Command
          className="min-h-0 rounded-none px-1 pb-2"
          filter={filterReuseConfigModelId}
        >
          <CommandInput
            autoFocus
            placeholder={intl.formatMessage({ id: "settings.modelProvider.reuseConfigSearch" })}
          />
          <CommandList className="max-h-[min(26rem,55vh)]">
            <CommandEmpty className="px-3 py-6 text-center text-foreground-subtle">
              {intl.formatMessage({ id: "settings.modelProvider.reuseConfigEmpty" })}
            </CommandEmpty>
            <CommandGroup className="p-0">
              {options.map((option) => {
                const isSelected = option.key === selectedKey;
                const primarySource = option.sources[0];
                if (!primarySource) return null;
                const providerNames = [
                  ...new Set(
                    option.sources
                      .filter((source) => source.modelId === primarySource.modelId)
                      .map((source) => source.providerName),
                  ),
                ];
                const properties = option.config.properties;
                const tokenDetails: { label: string; value: string }[] = [];
                if (properties?.contextWindow != null) {
                  tokenDetails.push({
                    label: intl.formatMessage({ id: "settings.modelProvider.reuseConfigContext" }),
                    value: formatTokenSize(properties.contextWindow, locale),
                  });
                }
                const maxOutputTokens = option.config.optionSpecs?.maxOutputTokens?.max;
                if (maxOutputTokens != null) {
                  tokenDetails.push({
                    label: intl.formatMessage({ id: "settings.modelProvider.reuseConfigMaxOutput" }),
                    value: formatTokenSize(maxOutputTokens, locale),
                  });
                }
                const inputTypes = [
                  properties?.inputFormat?.supportsImage ? "Image" : null,
                  properties?.inputFormat?.supportsVideo ? "Video" : null,
                  properties?.inputFormat?.supportsAudio ? "Audio" : null,
                  properties?.inputFormat?.supportsPdf ? "PDF" : null,
                ].filter((inputType): inputType is string => inputType !== null);
                const visibleInputTypes = inputTypes.slice(0, 3);
                const remainingInputTypeCount = inputTypes.length - visibleInputTypes.length;
                const selectedMetadataTagClassName =
                  isSelected &&
                  "!border-primary-foreground/30 !bg-primary-foreground/10 !text-primary-foreground";
                const tokenTagClassName = cn(
                  MODEL_CONTEXT_WINDOW_BADGE_CLASS_NAME,
                  "max-w-none",
                  selectedMetadataTagClassName,
                );
                const metadataTagClassName = cn(
                  MODEL_INPUT_CAPABILITY_BADGE_CLASS_NAME,
                  selectedMetadataTagClassName,
                );
                const allProvidersLabel = new Intl.ListFormat(locale, {
                  style: "long",
                  type: "conjunction",
                }).format(providerNames);
                return (
                  <CommandItem
                    key={option.key}
                    value={option.key}
                    keywords={[option.searchText]}
                    onSelect={() => setSelectedKey(option.key)}
                    className={cn(
                      "items-start py-2",
                      isSelected &&
                        "!bg-primary !text-primary-foreground hover:!bg-primary",
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-center justify-between gap-3">
                        <code
                          className={cn(
                            "min-w-0 truncate font-mono text-ui-sm text-foreground",
                            isSelected && "!text-primary-foreground",
                          )}
                        >
                          {primarySource.modelId}
                        </code>
                        <span
                          title={providerNames.length > 1 ? allProvidersLabel : undefined}
                          className={cn(
                            "shrink-0 text-ui-sm text-foreground-subtle",
                            isSelected && "!text-primary-foreground/75",
                          )}
                        >
                          {option.providersLabel}
                        </span>
                      </div>
                      {tokenDetails.length > 0 || visibleInputTypes.length > 0 ? (
                        <div className="mt-1 flex min-w-0 items-center gap-1.5 overflow-hidden whitespace-nowrap">
                          {tokenDetails.map(({ label, value }) => (
                            <span
                              key={label}
                              className={tokenTagClassName}
                            >
                              {label} {value}
                            </span>
                          ))}
                          {visibleInputTypes.map((inputType) => (
                            <span
                              key={inputType}
                              className={metadataTagClassName}
                            >
                              {inputType}
                            </span>
                          ))}
                          {remainingInputTypeCount > 0 ? (
                            <span
                              className={metadataTagClassName}
                            >
                              +{remainingInputTypeCount}
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
        <div className="flex justify-end gap-2 border-t border-border px-4 py-3">
          <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
            {intl.formatMessage({ id: "common.cancel" })}
          </Button>
          <Button
            type="button"
            disabled={!selectedOption}
            onClick={() => {
              if (selectedOption) onApply(selectedOption);
            }}
          >
            {intl.formatMessage({ id: "settings.modelProvider.reuseConfigApply" })}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
