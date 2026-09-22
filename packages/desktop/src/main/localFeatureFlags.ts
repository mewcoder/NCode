import { ZCODE_DESKTOP_CONTEXT_PROMPT_ENABLED_ENV } from "@zcode/shared";

type EnvRecord = Record<string, string | undefined>;

export function resolveLocalDesktopContextPromptEnabled(env: EnvRecord): boolean {
  return isEnabled(env[ZCODE_DESKTOP_CONTEXT_PROMPT_ENABLED_ENV]);
}

function isEnabled(value: string | undefined): boolean {
  const normalized = value?.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes" || normalized === "on";
}
