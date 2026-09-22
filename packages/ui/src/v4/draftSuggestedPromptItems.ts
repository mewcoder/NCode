export interface DraftSuggestedPromptLocalizedText {
  cn?: string;
  en?: string;
}

export interface DraftSuggestedPromptItem {
  id: string;
  /** Lucide canonical name for the local recommendation. */
  iconName?: string;
  iconUrl?: string;
  iconStyle?: "plugin";
  label: DraftSuggestedPromptLocalizedText;
  prompt: DraftSuggestedPromptLocalizedText;
  plugin?: {
    stableId: string;
    label: DraftSuggestedPromptLocalizedText;
  };
}

export function resolveDraftSuggestedPromptText(
  text: DraftSuggestedPromptLocalizedText,
  locale: string,
): string {
  const primary = locale.startsWith("zh") ? text.cn : text.en;
  const fallback = locale.startsWith("zh") ? text.en : text.cn;
  return primary?.trim() || fallback?.trim() || "";
}
